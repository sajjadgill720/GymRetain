import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  RiskScoreConfig,
  defaultRiskScoreConfig,
} from '../../config/risk-score.config';
import {
  differenceInCalendarDays,
  subDays,
  startOfDay,
  isBefore,
} from 'date-fns';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface MemberRiskDetails {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  factors: {
    daysSinceLastCheckIn: number;
    daysInactiveScore: number;
    weeklyVisitsCurrent: number;
    fourWeekRollingAvg: number;
    frequencyDropPercentage: number;
    frequencyDropScore: number;
    isPaymentOverdue: boolean;
    paymentOverdueScore: number;
    isRecentlyBrokenStreak: boolean;
    brokenStreakScore: number;
  };
}

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pure scoring function: computes the 0-100 risk score and factors
   */
  calculateRiskScore(
    daysSinceLastCheckIn: number,
    weeklyVisitsCurrent: number,
    fourWeekRollingAvg: number,
    isPaymentOverdue: boolean,
    isRecentlyBrokenStreak: boolean,
    config: RiskScoreConfig = defaultRiskScoreConfig,
  ): {
    score: number;
    level: RiskLevel;
    daysInactiveScore: number;
    frequencyDropPercentage: number;
    frequencyDropScore: number;
    paymentOverdueScore: number;
    brokenStreakScore: number;
  } {
    const { weights, thresholds } = config;

    // 1. Days Inactive Score (0 - 100)
    let daysInactiveScore = 0;
    if (daysSinceLastCheckIn >= thresholds.daysInactive.critical) {
      daysInactiveScore = 100;
    } else if (daysSinceLastCheckIn >= thresholds.daysInactive.high) {
      daysInactiveScore = 80;
    } else if (daysSinceLastCheckIn >= thresholds.daysInactive.moderate) {
      daysInactiveScore = 50;
    } else if (daysSinceLastCheckIn > thresholds.daysInactive.low) {
      daysInactiveScore = 25;
    } else {
      daysInactiveScore = 0;
    }

    // 2. Frequency Drop Score (0 - 100)
    let frequencyDropPercentage = 0;
    let frequencyDropScore = 0;

    if (fourWeekRollingAvg > 0) {
      const drop = Math.max(0, fourWeekRollingAvg - weeklyVisitsCurrent);
      frequencyDropPercentage = Math.round((drop / fourWeekRollingAvg) * 100);

      if (frequencyDropPercentage >= thresholds.frequencyDropPercentage.complete) {
        frequencyDropScore = 100;
      } else if (frequencyDropPercentage >= thresholds.frequencyDropPercentage.severe) {
        frequencyDropScore = 80;
      } else if (frequencyDropPercentage >= thresholds.frequencyDropPercentage.moderate) {
        frequencyDropScore = 50;
      } else {
        frequencyDropScore = 0;
      }
    } else {
      // Member had 0 rolling average visits: if inactive, rely on daysInactive
      frequencyDropScore = daysSinceLastCheckIn > 7 ? 60 : 0;
    }

    // 3. Payment Overdue Score (0 or 100)
    const paymentOverdueScore = isPaymentOverdue ? 100 : 0;

    // 4. Recently Broken Streak Score (0 or 100)
    const brokenStreakScore = isRecentlyBrokenStreak ? 100 : 0;

    // Weighted composite score
    const rawScore =
      daysInactiveScore * weights.daysSinceLastCheckIn +
      frequencyDropScore * weights.frequencyDrop +
      paymentOverdueScore * weights.paymentOverdue +
      brokenStreakScore * weights.recentlyBrokenStreak;

    const score = Math.min(100, Math.max(0, Math.round(rawScore)));

    let level: RiskLevel = 'LOW';
    if (score >= thresholds.buckets.highThreshold) {
      level = 'HIGH';
    } else if (score >= thresholds.buckets.mediumThreshold) {
      level = 'MEDIUM';
    }

    return {
      score,
      level,
      daysInactiveScore,
      frequencyDropPercentage,
      frequencyDropScore,
      paymentOverdueScore,
      brokenStreakScore,
    };
  }

  /**
   * Retrieves all members for a gym, evaluates risk scores, and returns sorted at-risk members
   */
  async getAtRiskMembers(
    gymId: string,
    filterLevel?: RiskLevel,
  ): Promise<MemberRiskDetails[]> {
    const today = new Date();
    const fourWeeksAgo = subDays(today, 28);
    const sevenDaysAgo = subDays(today, 7);

    // Fetch active members with their check-ins over the past 4 weeks, active memberships, and streak
    const members = await this.prisma.member.findMany({
      where: { gymId, status: 'ACTIVE' },
      include: {
        streak: true,
        memberships: {
          orderBy: { endDate: 'desc' },
          take: 1,
        },
        checkIns: {
          where: {
            checkInDate: { gte: startOfDay(fourWeeksAgo) },
          },
          orderBy: { checkInDate: 'desc' },
        },
      },
    });

    const atRiskMembers: MemberRiskDetails[] = [];

    for (const member of members) {
      // 1. Days since last check-in
      const lastCheckIn = member.checkIns[0];
      const daysSinceLastCheckIn = lastCheckIn
        ? differenceInCalendarDays(today, lastCheckIn.checkInDate)
        : differenceInCalendarDays(today, member.joinDate);

      // 2. Visits in the current 7-day window
      const visitsPast7Days = member.checkIns.filter((ci) =>
        ci.checkInDate >= startOfDay(sevenDaysAgo),
      ).length;

      // 3. 4-week rolling average weekly visits
      const totalVisits4Weeks = member.checkIns.length;
      const fourWeekRollingAvg = Number((totalVisits4Weeks / 4).toFixed(1));

      // 4. Overdue payment flag
      const latestMembership = member.memberships[0];
      const isPaymentOverdue =
        !latestMembership ||
        latestMembership.status === 'EXPIRED' ||
        latestMembership.status === 'PENDING_PAYMENT' ||
        isBefore(latestMembership.endDate, today);

      // 5. Recently broken streak flag
      const isRecentlyBrokenStreak =
        !!member.streak?.streakBrokenAt &&
        differenceInCalendarDays(today, member.streak.streakBrokenAt) <=
          defaultRiskScoreConfig.thresholds.brokenStreakDaysWindow;

      const riskCalc = this.calculateRiskScore(
        daysSinceLastCheckIn,
        visitsPast7Days,
        fourWeekRollingAvg,
        isPaymentOverdue,
        isRecentlyBrokenStreak,
        defaultRiskScoreConfig,
      );

      if (!filterLevel || riskCalc.level === filterLevel) {
        atRiskMembers.push({
          memberId: member.id,
          memberCode: member.memberCode,
          fullName: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          riskScore: riskCalc.score,
          riskLevel: riskCalc.level,
          factors: {
            daysSinceLastCheckIn,
            daysInactiveScore: riskCalc.daysInactiveScore,
            weeklyVisitsCurrent: visitsPast7Days,
            fourWeekRollingAvg,
            frequencyDropPercentage: riskCalc.frequencyDropPercentage,
            frequencyDropScore: riskCalc.frequencyDropScore,
            isPaymentOverdue,
            paymentOverdueScore: riskCalc.paymentOverdueScore,
            isRecentlyBrokenStreak,
            brokenStreakScore: riskCalc.brokenStreakScore,
          },
        });
      }
    }

    // Sort descending by highest risk score
    return atRiskMembers.sort((a, b) => b.riskScore - a.riskScore);
  }
}
