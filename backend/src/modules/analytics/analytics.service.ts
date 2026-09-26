import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RetentionService } from '../retention/retention.service';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly retentionService: RetentionService,
  ) {}

  /**
   * Gym Owner Dashboard Overview KPIs
   */
  async getDashboardSummary(gymId: string) {
    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);

    const [
      activeMembersCount,
      todayCheckInsCount,
      streakLeaders,
      atRiskMembers,
    ] = await Promise.all([
      this.prisma.member.count({
        where: { gymId, status: 'ACTIVE' },
      }),
      this.prisma.checkIn.count({
        where: {
          gymId,
          checkInTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.streak.findMany({
        where: { gymId, currentStreak: { gt: 0 } },
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, memberCode: true },
          },
        },
        orderBy: { currentStreak: 'desc' },
        take: 5,
      }),
      this.retentionService.getAtRiskMembers(gymId),
    ]);

    const highRiskCount = atRiskMembers.filter((m) => m.riskLevel === 'HIGH').length;
    const mediumRiskCount = atRiskMembers.filter((m) => m.riskLevel === 'MEDIUM').length;

    return {
      kpis: {
        activeMembers: activeMembersCount,
        todayCheckIns: todayCheckInsCount,
        atRiskMembersTotal: highRiskCount + mediumRiskCount,
        highRiskCount,
        mediumRiskCount,
      },
      streakLeaders: streakLeaders.map((s) => ({
        memberId: s.memberId,
        memberName: `${s.member.firstName} ${s.member.lastName}`,
        memberCode: s.member.memberCode,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
      })),
      recentAtRiskPreview: atRiskMembers.slice(0, 5),
    };
  }

  /**
   * Attendance Trend: Group check-ins day-by-day for the last N days (default 30 days)
   */
  async getAttendanceTrends(gymId: string, days = 30) {
    const today = new Date();
    const startDate = startOfDay(subDays(today, days - 1));

    const checkIns = await this.prisma.checkIn.findMany({
      where: {
        gymId,
        checkInDate: { gte: startDate },
      },
      select: {
        checkInDate: true,
      },
    });

    // Bucket counts by day
    const trendMap = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const dateStr = format(subDays(today, days - 1 - i), 'yyyy-MM-dd');
      trendMap.set(dateStr, 0);
    }

    for (const ci of checkIns) {
      const dateStr = format(ci.checkInDate, 'yyyy-MM-dd');
      if (trendMap.has(dateStr)) {
        trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
      }
    }

    return Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      checkIns: count,
    }));
  }
}
