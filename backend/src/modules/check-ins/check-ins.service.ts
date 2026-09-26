import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { StreaksService } from '../streaks/streaks.service';
import { RewardsService } from '../rewards/rewards.service';
import { RecordCheckInDto } from './dto/record-checkin.dto';
import { startOfDay } from 'date-fns';

@Injectable()
export class CheckInsService {
  private readonly logger = new Logger(CheckInsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly streaksService: StreaksService,
    private readonly rewardsService: RewardsService,
  ) {}

  /**
   * Phase 1 QR & Front-Desk Check-in Flow:
   * 1. Resolves and validates member within the tenant gym
   * 2. If QR scan, verifies gym's qrCodeSecret
   * 3. Records check_in with timestamp and normalized checkInDate
   * 4. Updates consecutive streak
   * 5. Checks & unlocks any streak milestone rewards
   */
  async recordCheckIn(
    gymId: string,
    dto: RecordCheckInDto,
    staffId?: string,
  ) {
    // Verify Gym QR Secret if provided
    if (dto.qrSecret) {
      const gym = await this.prisma.gym.findUnique({
        where: { id: gymId },
        select: { qrCodeSecret: true },
      });
      if (!gym || gym.qrCodeSecret !== dto.qrSecret) {
        throw new BadRequestException('Invalid QR code scanned for this gym');
      }
    }

    // Resolve Member by ID, memberCode, or Phone
    const member = await this.prisma.member.findFirst({
      where: {
        gymId,
        OR: [
          { id: dto.memberIdentifier },
          { memberCode: dto.memberIdentifier },
          { phone: dto.memberIdentifier },
        ],
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException(
        `Member not found with identifier "${dto.memberIdentifier}" in this gym`,
      );
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Member account is currently ${member.status}. Cannot check in.`,
      );
    }

    const checkInTime = new Date();
    const checkInDate = startOfDay(checkInTime);

    // Run check-in, streak calculation, and reward unlocking in an atomic tenant transaction
    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // 1. Record Check-In
      const checkIn = await tx.checkIn.create({
        data: {
          gymId,
          memberId: member.id,
          checkInTime,
          checkInDate,
          method: dto.method || 'QR_SCAN',
          staffId,
          notes: dto.notes,
        },
      });

      // 2. Calculate and persist streak
      const streakResult = await this.streaksService.recordStreakForCheckIn(
        tx,
        gymId,
        member.id,
        checkInTime,
      );

      // 3. Evaluate and unlock any rewards
      const unlockedRewards = await this.rewardsService.evaluateAndUnlockStreakRewards(
        tx,
        gymId,
        member.id,
        streakResult.currentStreak,
      );

      this.logger.log(
        `Check-in recorded for member ${member.firstName} ${member.lastName} (${member.memberCode}). Streak: ${streakResult.currentStreak}`,
      );

      return {
        checkIn: {
          id: checkIn.id,
          checkInTime: checkIn.checkInTime,
          method: checkIn.method,
        },
        member: {
          id: member.id,
          code: member.memberCode,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          activeMembership: member.memberships[0] || null,
        },
        streak: {
          current: streakResult.currentStreak,
          longest: streakResult.longestStreak,
          incremented: streakResult.isIncremented,
          streakBroken: streakResult.isBroken,
        },
        unlockedRewards,
      };
    });
  }

  /**
   * List recent check-ins for the gym
   */
  async listRecentCheckIns(gymId: string, limit = 50) {
    return this.prisma.checkIn.findMany({
      where: { gymId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            phone: true,
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  }
}
