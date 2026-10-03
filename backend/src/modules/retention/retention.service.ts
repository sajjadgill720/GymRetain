import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  riskScore: number; // 0 - 100 (Heuristic estimate)
  riskLevel: RiskLevel;
  isNewMember: boolean;
  dataQuality: 'SUFFICIENT_BASELINE' | 'SPARSE_DATA' | 'PAUSED_MEMBERSHIP';
  disengagementExplanation: string;
  baselineWeeklyVisits: number;
  recentWeeklyVisits: number;
  scoreType: 'RULE_BASED_HEURISTIC_ESTIMATE';
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
  interventions?: any[];
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
      const daysSinceJoined = differenceInCalendarDays(today, member.joinDate);
      const isNewMember = daysSinceJoined < 14;

      // 1. Days since last check-in
      const lastCheckIn = member.checkIns[0];
      const daysSinceLastCheckIn = lastCheckIn
        ? differenceInCalendarDays(today, lastCheckIn.checkInDate)
        : daysSinceJoined;

      // 2. Visits in the current 7-day window
      const visitsPast7Days = member.checkIns.filter((ci) =>
        ci.checkInDate >= startOfDay(sevenDaysAgo),
      ).length;

      // 3. 4-week rolling average weekly visits (established baseline)
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

      // Explainable Disengagement Indicator
      const explanations: string[] = [];
      if (daysSinceLastCheckIn >= 14) {
        explanations.push(`Absent for ${daysSinceLastCheckIn} days (critical disengagement threshold).`);
      } else if (daysSinceLastCheckIn >= 7) {
        explanations.push(`No visits for ${daysSinceLastCheckIn} days.`);
      }

      if (fourWeekRollingAvg > 1 && riskCalc.frequencyDropPercentage >= 50) {
        explanations.push(
          `Weekly visit rate dropped by ${riskCalc.frequencyDropPercentage}% from their ${fourWeekRollingAvg} visits/week baseline.`,
        );
      }

      if (isPaymentOverdue) {
        explanations.push('Membership payment or renewal is overdue.');
      }

      if (isRecentlyBrokenStreak) {
        explanations.push('Workout streak was broken within the last 7 days.');
      }

      const disengagementExplanation =
        explanations.length > 0
          ? explanations.join(' ')
          : 'Attendance is aligned with personal baseline habits.';

      let dataQuality: 'SUFFICIENT_BASELINE' | 'SPARSE_DATA' | 'PAUSED_MEMBERSHIP' = 'SUFFICIENT_BASELINE';
      if (isNewMember) {
        dataQuality = 'SPARSE_DATA';
      }

      if (!filterLevel || riskCalc.level === filterLevel) {
        atRiskMembers.push({
          memberId: member.id,
          memberCode: member.memberCode,
          fullName: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          riskScore: riskCalc.score,
          riskLevel: riskCalc.level,
          isNewMember,
          dataQuality,
          disengagementExplanation,
          baselineWeeklyVisits: fourWeekRollingAvg,
          recentWeeklyVisits: visitsPast7Days,
          scoreType: 'RULE_BASED_HEURISTIC_ESTIMATE',
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

  /**
   * Records a staff retention intervention (notes, outreach draft, outcome)
   */
  async recordIntervention(
    gymId: string,
    dto: {
      memberId: string;
      status: string;
      assignedStaffId?: string;
      assignedStaffName?: string;
      notes?: string;
      outreachDraft?: string;
      followUpDate?: string;
    },
    staffId: string,
    actorRole: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const audit = await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId,
        actorRole,
        action: 'RETENTION_INTERVENTION_RECORDED',
        resource: 'MEMBER_RETENTION',
        metadata: {
          memberId: dto.memberId,
          memberCode: member.memberCode,
          status: dto.status,
          assignedStaffId: dto.assignedStaffId || staffId,
          assignedStaffName: dto.assignedStaffName,
          notes: dto.notes,
          outreachDraft: dto.outreachDraft,
          followUpDate: dto.followUpDate,
          timestamp: new Date().toISOString(),
        },
      },
    });

    return {
      success: true,
      message: 'Retention follow-up and intervention outcome recorded successfully.',
      intervention: {
        id: audit.id,
        memberId: dto.memberId,
        status: dto.status,
        notes: dto.notes,
        followUpDate: dto.followUpDate,
        createdAt: audit.createdAt,
      },
    };
  }

  /**
   * Retrieves intervention history for a member
   */
  async getMemberInterventions(gymId: string, memberId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        gymId,
        action: 'RETENTION_INTERVENTION_RECORDED',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return logs
      .filter((l) => (l.metadata as any)?.memberId === memberId)
      .map((l) => ({
        id: l.id,
        createdAt: l.createdAt,
        staffId: l.staffId,
        metadata: l.metadata,
      }));
  }
}

