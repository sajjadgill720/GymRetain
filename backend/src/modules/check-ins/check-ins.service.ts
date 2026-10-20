import { MemberPassService } from '../member/member-pass.service';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { StreaksService } from '../streaks/streaks.service';
import { RewardsService } from '../rewards/rewards.service';
import { RecordCheckInDto } from './dto/record-checkin.dto';
import { RecordCheckOutDto, CorrectCheckOutDto } from './dto/record-checkout.dto';
import { getLocalDayBoundsUtc } from '../../common/utils/timezone.util';
import { differenceInMinutes, subHours } from 'date-fns';

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
   * Records a member check-in visit session:
   * 1. Resolves and validates member within the tenant gym
   * 2. If QR scan or credential supplied, verifies validity and revocation status
   * 3. Idempotency check to prevent duplicate scans from retries/lag
   * 4. Enforces Single Open Session: prevents duplicate open sessions
   * 5. Atomically evaluates gym capacity policy (WARNING_ONLY vs BLOCK_ADMISSION)
   * 6. Normalizes checkInDate using the gym's IANA timezone
   * 7. Updates streak and milestone rewards
   */
  async recordCheckIn(
    gymId: string,
    dto: RecordCheckInDto,
    staffId?: string,
  ) {
    // Rotating member passes are checked before resolving identifiers or idempotency.
    const rawPass = dto.memberIdentifier.startsWith('grm.') ? dto.memberIdentifier : null;
    let signedPass = rawPass;
    if (dto.qrPayload) {
      try { const parsed = JSON.parse(dto.qrPayload); if (parsed.type === 'MEMBER_PASS') signedPass = parsed.token; }
      catch { throw new BadRequestException('Malformed QR code payload'); }
    }
    if (signedPass) { dto.memberIdentifier = new MemberPassService().verify(signedPass, gymId); dto.qrCredential = undefined; }
    // 1. Check idempotency if client supplied idempotencyKey
    if (dto.idempotencyKey) {
      const existingKey = await this.prisma.checkIn.findFirst({
        where: { gymId, idempotencyKey: dto.idempotencyKey },
        include: {
          member: {
            select: { id: true, memberCode: true, firstName: true, lastName: true, phone: true },
          },
        },
      });
      if (existingKey) {
        return {
          duplicateIgnored: true,
          message: 'Check-in was already recorded with this idempotency key.',
          checkIn: {
            id: existingKey.id,
            checkInTime: existingKey.checkInTime,
            method: existingKey.method,
            sessionStatus: existingKey.sessionStatus,
          },
          member: {
            id: existingKey.member.id,
            code: existingKey.member.memberCode,
            name: `${existingKey.member.firstName} ${existingKey.member.lastName}`,
            phone: existingKey.member.phone,
          },
        };
      }
    }

    // 2. Defense against cross-tenant QR scans
    if (dto.qrPayload) {
      try {
        const parsed = JSON.parse(dto.qrPayload);
        if (parsed.gymId && parsed.gymId !== gymId) {
          throw new ForbiddenException(
            'Cross-tenant QR violation: Scanned QR code belongs to a different gym',
          );
        }
        if (parsed.qrSecret) {
          dto.qrSecret = parsed.qrSecret;
        }
      } catch (err: any) {
        if (err instanceof ForbiddenException) throw err;
        throw new BadRequestException('Malformed QR code payload');
      }
    }

    // 3. Verify Gym Placard QR Secret if supplied
    if (dto.qrSecret) {
      const gym = await this.prisma.gym.findUnique({
        where: { id: gymId },
        select: { qrCodeSecret: true },
      });
      if (!gym || gym.qrCodeSecret !== dto.qrSecret) {
        throw new ForbiddenException('Invalid or expired QR code for this gym');
      }
    }

    // 4. Resolve Member by ID, memberCode, Phone, or Individual Member QR Credential
    const searchIdentifier = dto.qrCredential || dto.memberIdentifier;
    const member = await this.prisma.member.findFirst({
      where: {
        gymId,
        OR: [
          { id: searchIdentifier },
          { memberCode: searchIdentifier },
          { phone: searchIdentifier },
          { qrCredential: searchIdentifier },
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
        `Member not found with identifier "${searchIdentifier}" in this gym`,
      );
    }

    // Check if QR credential was specifically used and revoked
    if (dto.qrCredential && member.qrCredentialRevokedAt) {
      throw new ForbiddenException('This member QR credential has been revoked. Please request a new QR.');
    }

    if (member.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Member account is currently ${member.status}. Cannot check in.`,
      );
    }

    // 5. Fetch Gym Capacity & Policy, and Timezone
    const gym = await this.prisma.gym.findUniqueOrThrow({
      where: { id: gymId },
      select: { capacity: true, capacityPolicy: true, timezone: true },
    });

    const checkInTime = new Date();
    // Normalize date to calendar day in gym's IANA timezone
    const dayBounds = getLocalDayBoundsUtc(gym.timezone, checkInTime);
    const checkInDate = dayBounds.start;

    // 6. Run Atomic Check-In, Open Session Enforcement, Capacity Check, and Streaks
    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // Prevent duplicate open sessions: A member can only have ONE open session per gym
      const activeSession = await tx.checkIn.findFirst({
        where: {
          gymId,
          memberId: member.id,
          sessionStatus: 'OPEN',
        },
      });

      if (activeSession) {
        throw new ConflictException(
          `Already checked in. Member has an open visit session from ${activeSession.checkInTime.toLocaleTimeString()}. Check out first before checking in again.`,
        );
      }

      // Atomically count currently open sessions
      const currentOpenSessions = await tx.checkIn.count({
        where: {
          gymId,
          sessionStatus: 'OPEN',
        },
      });

      // Capacity policy enforcement
      const capacity = gym.capacity || 100;
      if (gym.capacityPolicy === 'BLOCK_ADMISSION' && currentOpenSessions >= capacity) {
        throw new BadRequestException(
          `Gym capacity reached (${currentOpenSessions}/${capacity}). Admission is blocked by gym policy.`,
        );
      }

      // Record Check-In Session
      const checkIn = await tx.checkIn.create({
        data: {
          gymId,
          memberId: member.id,
          checkInTime,
          checkInDate,
          checkOutTime: null,
          isEstimatedDeparture: false,
          sessionStatus: 'OPEN',
          idempotencyKey: dto.idempotencyKey || null,
          method: dto.method || 'QR_SCAN',
          staffId,
          notes: dto.notes,
        },
      });

      // Calculate and persist streak
      const streakResult = await this.streaksService.recordStreakForCheckIn(
        tx,
        gymId,
        member.id,
        checkInTime,
      );

      // Evaluate and unlock any rewards
      const unlockedRewards = await this.rewardsService.evaluateAndUnlockStreakRewards(
        tx,
        gymId,
        member.id,
        streakResult.currentStreak,
      );

      const capacityWarning =
        currentOpenSessions + 1 >= capacity && gym.capacityPolicy === 'WARNING_ONLY'
          ? `Floor capacity alert: Gym is now at or above capacity (${currentOpenSessions + 1}/${capacity}).`
          : null;

      this.logger.log(
        `Session opened for member ${member.firstName} ${member.lastName} (${member.memberCode}). Open visits: ${currentOpenSessions + 1}/${capacity}`,
      );

      return {
        checkIn: {
          id: checkIn.id,
          checkInTime: checkIn.checkInTime,
          method: checkIn.method,
          sessionStatus: checkIn.sessionStatus,
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
        capacity: {
          currentOccupancy: currentOpenSessions + 1,
          limit: capacity,
          warning: capacityWarning,
        },
        unlockedRewards,
      };
    });
  }

  /**
   * Explicit Check-Out Action:
   * Closes an active attendance session, records explicit checkOutTime,
   * and calculates duration. Does not toggle automatically.
   */
  async recordCheckOut(
    gymId: string,
    dto: RecordCheckOutDto,
    staffId?: string,
  ) {
    const { memberIdentifier, notes } = dto;

    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // Find open session by checkIn ID or by member lookup
      const session = await tx.checkIn.findFirst({
        where: {
          gymId,
          sessionStatus: 'OPEN',
          OR: [
            { id: memberIdentifier },
            { memberId: memberIdentifier },
            { member: { memberCode: memberIdentifier } },
            { member: { phone: memberIdentifier } },
            { member: { qrCredential: memberIdentifier } },
          ],
        },
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, memberCode: true, phone: true },
          },
        },
      });

      if (!session) {
        throw new NotFoundException(
          `No active open visit session found for "${memberIdentifier}" in this gym.`,
        );
      }

      const checkOutTime = new Date();
      const durationMinutes = Math.max(1, differenceInMinutes(checkOutTime, session.checkInTime));

      const updated = await tx.checkIn.update({
        where: { id: session.id },
        data: {
          checkOutTime,
          checkOutStaffId: staffId || null,
          sessionStatus: 'COMPLETED',
          isEstimatedDeparture: false,
          notes: notes ? `${session.notes ? session.notes + '; ' : ''}${notes}` : session.notes,
        },
      });

      this.logger.log(
        `Session completed for member ${session.member.firstName} ${session.member.lastName}. Duration: ${durationMinutes} mins`,
      );

      return {
        success: true,
        message: 'Check-out completed successfully.',
        session: {
          id: updated.id,
          checkInTime: updated.checkInTime,
          checkOutTime: updated.checkOutTime,
          durationMinutes,
          sessionStatus: updated.sessionStatus,
        },
        member: session.member,
      };
    });
  }

  /**
   * Correct a missed checkout with audit logging
   */
  async correctMissedCheckOut(
    gymId: string,
    sessionId: string,
    dto: CorrectCheckOutDto,
    staffId: string,
    actorRole: string,
  ) {
    const session = await this.prisma.checkIn.findFirst({
      where: { id: sessionId, gymId },
      include: {
        member: { select: { id: true, memberCode: true, firstName: true, lastName: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    const correctedTime = new Date(dto.checkOutTime);
    if (isNaN(correctedTime.getTime()) || correctedTime < session.checkInTime) {
      throw new BadRequestException('Corrected check-out time must be after check-in time');
    }

    const previousCheckOutTime = session.checkOutTime;
    const previousStatus = session.sessionStatus;

    const updated = await this.prisma.checkIn.update({
      where: { id: sessionId },
      data: {
        checkOutTime: correctedTime,
        checkOutStaffId: staffId,
        sessionStatus: 'CORRECTED',
        isEstimatedDeparture: false,
        notes: dto.notes ? `${session.notes ? session.notes + '; ' : ''}Correction: ${dto.notes}` : session.notes,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId,
        actorRole,
        action: 'ATTENDANCE_CHECKOUT_CORRECTED',
        resource: 'ATTENDANCE_SESSION',
        metadata: {
          sessionId,
          memberId: session.member.id,
          memberCode: session.member.memberCode,
          previousCheckOutTime,
          previousStatus,
          correctedTime: correctedTime.toISOString(),
          reason: dto.notes || 'Staff correction',
        },
      },
    });

    return {
      success: true,
      message: 'Attendance record corrected successfully with audit trail.',
      session: updated,
    };
  }

  /**
   * Auto-closes stale open sessions older than maxHours (default: 6 hours)
   * Stale sessions are marked isEstimatedDeparture: true and excluded from average duration.
   */
  async autoCloseStaleSessions(gymId: string, maxHours: number = 6) {
    const threshold = subHours(new Date(), maxHours);

    const staleSessions = await this.prisma.checkIn.findMany({
      where: {
        gymId,
        sessionStatus: 'OPEN',
        checkInTime: { lte: threshold },
      },
      select: { id: true, checkInTime: true },
    });

    if (staleSessions.length === 0) {
      return { closedCount: 0 };
    }

    const result = await this.prisma.checkIn.updateMany({
      where: {
        id: { in: staleSessions.map((s) => s.id) },
      },
      data: {
        sessionStatus: 'AUTO_CLOSED',
        isEstimatedDeparture: true,
        checkOutTime: new Date(),
      },
    });

    return {
      closedCount: result.count,
      message: `Auto-closed ${result.count} stale sessions older than ${maxHours} hours with estimated departure.`,
    };
  }

  /**
   * Reconciles legacy check-in records from prior days that never received checkout times
   */
  async reconcileLegacyCheckIns(gymId: string) {
    const today = new Date();
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { timezone: true },
    });
    const bounds = getLocalDayBoundsUtc(gym?.timezone || 'Asia/Karachi', today);

    const legacyUnclosed = await this.prisma.checkIn.updateMany({
      where: {
        gymId,
        checkOutTime: null,
        checkInTime: { lt: bounds.start },
      },
      data: {
        sessionStatus: 'AUTO_CLOSED',
        legacyEstimated: true,
        isEstimatedDeparture: true,
      },
    });

    return {
      reconciledCount: legacyUnclosed.count,
      message: `Reconciled ${legacyUnclosed.count} historical unclosed check-ins as legacy estimates.`,
    };
  }

  /**
   * List recent check-in & check-out sessions for the gym
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
        staff: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { checkInTime: 'desc' },
      take: limit,
    });
  }

  /**
   * List currently active open attendance sessions
   */
  async listOpenSessions(gymId: string) {
    return this.prisma.checkIn.findMany({
      where: { gymId, sessionStatus: 'OPEN' },
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
    });
  }
}
