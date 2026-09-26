import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { differenceInCalendarDays, startOfDay } from 'date-fns';
import { Prisma } from '@prisma/client';

export interface StreakCalculationResult {
  memberId: string;
  previousStreak: number;
  currentStreak: number;
  longestStreak: number;
  isIncremented: boolean;
  isBroken: boolean;
  isFirstVisitToday: boolean;
}

@Injectable()
export class StreaksService {
  private readonly logger = new Logger(StreaksService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Core Streak Calculation Algorithm:
   * Consecutive-day rule:
   * - Same day (gap == 0): Already recorded today, streak unchanged.
   * - Next consecutive day (gap == 1): Current streak increments by 1.
   * - Gap > 1 day: Streak broken! Resets to 1, logs break timestamp.
   * - First check-in: Streak starts at 1.
   */
  calculateStreakUpdate(
    currentStreakRecord: {
      currentStreak: number;
      longestStreak: number;
      lastCheckInDate: Date | null;
    } | null,
    targetCheckInDate: Date,
  ): {
    currentStreak: number;
    longestStreak: number;
    isIncremented: boolean;
    isBroken: boolean;
    isFirstVisitToday: boolean;
    brokenAt: Date | null;
  } {
    const checkInDay = startOfDay(targetCheckInDate);

    if (!currentStreakRecord || !currentStreakRecord.lastCheckInDate) {
      // First check-in ever
      return {
        currentStreak: 1,
        longestStreak: 1,
        isIncremented: true,
        isBroken: false,
        isFirstVisitToday: true,
        brokenAt: null,
      };
    }

    const lastDay = startOfDay(currentStreakRecord.lastCheckInDate);
    const dayDifference = differenceInCalendarDays(checkInDay, lastDay);

    if (dayDifference === 0) {
      // Member already checked in earlier today - streak does not duplicate
      return {
        currentStreak: currentStreakRecord.currentStreak,
        longestStreak: currentStreakRecord.longestStreak,
        isIncremented: false,
        isBroken: false,
        isFirstVisitToday: false,
        brokenAt: null,
      };
    } else if (dayDifference === 1) {
      // Consecutive day visit!
      const newCurrent = currentStreakRecord.currentStreak + 1;
      const newLongest = Math.max(currentStreakRecord.longestStreak, newCurrent);
      return {
        currentStreak: newCurrent,
        longestStreak: newLongest,
        isIncremented: true,
        isBroken: false,
        isFirstVisitToday: true,
        brokenAt: null,
      };
    } else if (dayDifference > 1) {
      // Gap > 1 day: Streak was broken!
      return {
        currentStreak: 1, // Restarts today
        longestStreak: currentStreakRecord.longestStreak,
        isIncremented: false,
        isBroken: true,
        isFirstVisitToday: true,
        brokenAt: new Date(),
      };
    } else {
      // Past date check-in (clock skew / backfill)
      return {
        currentStreak: currentStreakRecord.currentStreak,
        longestStreak: currentStreakRecord.longestStreak,
        isIncremented: false,
        isBroken: false,
        isFirstVisitToday: false,
        brokenAt: null,
      };
    }
  }

  /**
   * Process and persist streak update for a member in a transaction
   */
  async recordStreakForCheckIn(
    tx: Prisma.TransactionClient,
    gymId: string,
    memberId: string,
    checkInTime: Date,
  ): Promise<StreakCalculationResult> {
    let streakRecord = await tx.streak.findUnique({
      where: { memberId },
    });

    if (!streakRecord) {
      streakRecord = await tx.streak.create({
        data: {
          gymId,
          memberId,
          currentStreak: 0,
          longestStreak: 0,
        },
      });
    }

    const previousStreak = streakRecord.currentStreak;
    const calc = this.calculateStreakUpdate(streakRecord, checkInTime);

    if (calc.isFirstVisitToday) {
      await tx.streak.update({
        where: { memberId },
        data: {
          currentStreak: calc.currentStreak,
          longestStreak: calc.longestStreak,
          lastCheckInDate: startOfDay(checkInTime),
          ...(calc.isBroken ? { streakBrokenAt: calc.brokenAt } : {}),
        },
      });
    }

    return {
      memberId,
      previousStreak,
      currentStreak: calc.currentStreak,
      longestStreak: calc.longestStreak,
      isIncremented: calc.isIncremented,
      isBroken: calc.isBroken,
      isFirstVisitToday: calc.isFirstVisitToday,
    };
  }

  /**
   * Get member streak details
   */
  async getMemberStreak(gymId: string, memberId: string) {
    return this.prisma.streak.findFirst({
      where: { memberId, gymId },
    });
  }
}
