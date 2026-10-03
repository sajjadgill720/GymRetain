import { ConflictException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CheckInsService } from '../src/modules/check-ins/check-ins.service';
import { MembersService } from '../src/modules/members/members.service';
import { SaasBillingService } from '../src/modules/saas-billing/saas-billing.service';
import { getLocalDayBoundsUtc, getLocalHourOfDay } from '../src/common/utils/timezone.util';

describe('GymRetain Multi-Tenant SaaS: Capacity, Attendance Sessions & Paid Tiers', () => {
  const GYM_ID = '11111111-1111-1111-1111-111111111111';
  const MEMBER_ID = 'member-uuid-001';

  describe('1. Attendance Sessions & Single Open Visit Rule', () => {
    let checkInsService: CheckInsService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        checkIn: {
          findFirst: jest.fn(),
          count: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
          updateMany: jest.fn(),
        },
        gym: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            id: GYM_ID,
            capacity: 50,
            capacityPolicy: 'BLOCK_ADMISSION',
            timezone: 'Asia/Karachi',
          }),
          findUnique: jest.fn().mockResolvedValue({
            id: GYM_ID,
            capacity: 50,
            capacityPolicy: 'BLOCK_ADMISSION',
            timezone: 'Asia/Karachi',
          }),
        },
        member: {
          findFirst: jest.fn().mockResolvedValue({
            id: MEMBER_ID,
            memberCode: 'GR-1001',
            firstName: 'Ali',
            lastName: 'Khan',
            phone: '+923001234567',
            status: 'ACTIVE',
            memberships: [{ status: 'ACTIVE' }],
          }),
        },
      };

      mockTenantPrisma = {
        runWithTenantRLS: jest.fn(async (_gymId, fn) => {
          return fn(mockPrisma);
        }),
      };

      checkInsService = new CheckInsService(
        mockPrisma,
        mockTenantPrisma,
        { recordStreakForCheckIn: jest.fn().mockResolvedValue({ currentStreak: 5, longestStreak: 10 }) } as any,
        { evaluateAndUnlockStreakRewards: jest.fn().mockResolvedValue([]) } as any,
      );
    });

    it('should REJECT check-in when member already has an open visit session (ConflictException)', async () => {
      // Mock existing open session
      mockPrisma.checkIn.findFirst.mockResolvedValueOnce({
        id: 'open-session-1',
        sessionStatus: 'OPEN',
        checkInTime: new Date(Date.now() - 30 * 60 * 1000),
      });

      await expect(
        checkInsService.recordCheckIn(GYM_ID, {
          memberIdentifier: 'GR-1001',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should BLOCK check-in atomically when gym capacity is reached and policy is BLOCK_ADMISSION', async () => {
      // No existing session for member
      mockPrisma.checkIn.findFirst.mockResolvedValueOnce(null);
      // But gym is already at capacity (50/50)
      mockPrisma.checkIn.count.mockResolvedValueOnce(50);

      await expect(
        checkInsService.recordCheckIn(GYM_ID, {
          memberIdentifier: 'GR-1001',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow legitimate return visit after explicit check-out completes previous visit', async () => {
      // 1. First visit is closed: no open session
      mockPrisma.checkIn.findFirst.mockResolvedValueOnce(null);
      mockPrisma.checkIn.count.mockResolvedValueOnce(12); // occupancy well below 50
      mockPrisma.checkIn.create.mockResolvedValueOnce({
        id: 'session-visit-2',
        checkInTime: new Date(),
        sessionStatus: 'OPEN',
        method: 'QR_SCAN',
      });

      const result = await checkInsService.recordCheckIn(GYM_ID, {
        memberIdentifier: 'GR-1001',
      });

      expect(result.checkIn.id).toBe('session-visit-2');
      expect(result.checkIn.sessionStatus).toBe('OPEN');
    });

    it('should explicitly check out a member and calculate visit duration in minutes', async () => {
      const checkInTime = new Date(Date.now() - 45 * 60 * 1000); // 45 minutes ago
      mockPrisma.checkIn.findFirst.mockResolvedValueOnce({
        id: 'session-to-checkout',
        checkInTime,
        sessionStatus: 'OPEN',
        member: {
          id: MEMBER_ID,
          memberCode: 'GR-1001',
          firstName: 'Ali',
          lastName: 'Khan',
          phone: '+923001234567',
        },
      });

      mockPrisma.checkIn.update.mockImplementationOnce(({ data }) => ({
        id: 'session-to-checkout',
        checkInTime,
        checkOutTime: data.checkOutTime,
        sessionStatus: data.sessionStatus,
      }));

      const checkoutResult = await checkInsService.recordCheckOut(GYM_ID, {
        memberIdentifier: 'GR-1001',
      });

      expect(checkoutResult.success).toBe(true);
      expect(checkoutResult.session.durationMinutes).toBeGreaterThanOrEqual(44);
      expect(checkoutResult.session.sessionStatus).toBe('COMPLETED');
    });
  });

  describe('2. Member QR Credentials & Concurrency-Safe Member Codes', () => {
    let membersService: MembersService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        member: {
          count: jest.fn().mockResolvedValue(15),
          findFirst: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          update: jest.fn(),
        },
        gym: {
          findUnique: jest.fn().mockResolvedValue({ maxMembers: 100 }),
        },
        streak: {
          create: jest.fn(),
        },
        auditLog: {
          create: jest.fn(),
        },
      };

      mockTenantPrisma = {
        runWithTenantRLS: jest.fn(async (_gymId, fn) => {
          return fn(mockPrisma);
        }),
      };

      membersService = new MembersService(mockPrisma, mockTenantPrisma);
    });

    it('should generate an individual opaque QR credential upon member creation without PII', async () => {
      mockPrisma.member.create.mockImplementationOnce(({ data }) => ({
        id: 'new-member-uuid',
        ...data,
      }));

      const newMember = await membersService.createMember(GYM_ID, {
        firstName: 'Zainab',
        lastName: 'Bibi',
        phone: '+923009998877',
      });

      expect(newMember.qrCredential).toBeDefined();
      expect(typeof newMember.qrCredential).toBe('string');
      // Must not contain phone or name in plaintext
      expect(newMember.qrCredential.includes('Zainab')).toBe(false);
      expect(newMember.qrCredential.includes('92300')).toBe(false);
    });

    it('should enforce member plan quota limits server-side (ForbiddenException)', async () => {
      // Gym plan allows 10 members max
      mockPrisma.gym.findUnique.mockResolvedValueOnce({ maxMembers: 10 });
      // Already 10 active members exist
      mockPrisma.member.count.mockResolvedValueOnce(10);

      await expect(
        membersService.createMember(GYM_ID, {
          firstName: 'Over',
          lastName: 'Quota',
          phone: '+923005554433',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should revoke a member QR credential and record an audit log entry', async () => {
      mockPrisma.member.findFirst.mockResolvedValueOnce({
        id: MEMBER_ID,
        memberCode: 'GR-1001',
        qrCredential: 'valid-token-123',
      });

      const revokeResult = await membersService.revokeQrCredential(
        GYM_ID,
        MEMBER_ID,
        'staff-1',
        'GYM_OWNER',
      );

      expect(revokeResult.success).toBe(true);
      expect(mockPrisma.member.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: MEMBER_ID },
          data: expect.objectContaining({ qrCredential: null }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'MEMBER_QR_CREDENTIAL_REVOKED' }),
        }),
      );
    });
  });

  describe('3. Timezone Utilities & Half-Open Date Bounds', () => {
    it('should calculate correct local day bounds [startUtc, endUtc) for Asia/Karachi (UTC+5)', () => {
      const refDate = new Date('2026-10-03T12:00:00Z');
      const bounds = getLocalDayBoundsUtc('Asia/Karachi', refDate);

      expect(bounds.dateStr).toBe('2026-10-03');
      // Karachi local midnight 2026-10-03 00:00 is 2026-10-02 19:00 UTC
      expect(bounds.start.toISOString()).toBe('2026-10-02T19:00:00.000Z');
      expect(bounds.end.toISOString()).toBe('2026-10-03T19:00:00.000Z');
      // Exact 24 hour span
      expect(bounds.end.getTime() - bounds.start.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('should extract local arrival hour accurately in target gym timezone', () => {
      // 14:30 UTC is 19:30 in Karachi (hour 19)
      const testDate = new Date('2026-10-03T14:30:00Z');
      const localHour = getLocalHourOfDay(testDate, 'Asia/Karachi');

      expect(localHour).toBe(19);
    });
  });

  describe('4. SaaS Subscription Management & Billing Sandbox', () => {
    let billingService: SaasBillingService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        gym: {
          findUnique: jest.fn().mockResolvedValue({
            id: GYM_ID,
            name: 'K-Town Fitness',
            saasPlan: 'TRIAL',
            saasStatus: 'TRIALING',
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            maxMembers: 50,
            maxStaff: 5,
          }),
          update: jest.fn(),
        },
        member: { count: jest.fn().mockResolvedValue(12) },
        gymStaff: { count: jest.fn().mockResolvedValue(2) },
        saaSBillingRecord: {
          findUnique: jest.fn().mockResolvedValue(null),
          create: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
        },
        auditLog: { create: jest.fn() },
      };

      mockTenantPrisma = {
        runWithTenantRLS: jest.fn(async (_gymId, fn) => {
          return fn(mockPrisma);
        }),
      };

      billingService = new SaasBillingService(mockPrisma, mockTenantPrisma);
    });

    it('should retrieve verified SaaS status and usage limits against plan entitlements', async () => {
      const status = await billingService.getSubscriptionStatus(GYM_ID);

      expect(status.plan).toBe('TRIAL');
      expect(status.status).toBe('TRIALING');
      expect(status.isTrialActive).toBe(true);
      expect(status.usage.members.current).toBe(12);
      expect(status.usage.members.max).toBe(50);
      expect(status.entitlements.canUseAiRadar).toBe(false); // Pro required
    });

    it('should simulate a paid upgrade to PRO tier and atomically update limits', async () => {
      mockPrisma.gym.update.mockResolvedValueOnce({
        id: GYM_ID,
        name: 'K-Town Fitness',
        saasPlan: 'PRO',
        saasStatus: 'ACTIVE',
        maxMembers: 500,
        maxStaff: 15,
      });

      mockPrisma.saaSBillingRecord.create.mockResolvedValueOnce({
        id: 'bill-record-1',
        amount: 2200000,
        currency: 'PKR',
        plan: 'PRO',
        status: 'PAID',
        invoiceNumber: 'INV-PRO-001',
      });

      const upgradeResult: any = await billingService.confirmSubscriptionPayment(
        GYM_ID,
        'PRO',
        'SANDBOX_SIMULATOR',
        'INV-PRO-001',
        'staff-owner-1',
        'GYM_OWNER',
      );

      expect(upgradeResult.success).toBe(true);
      expect(upgradeResult.gym.saasPlan).toBe('PRO');
      expect(upgradeResult.gym.maxMembers).toBe(500);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'SAAS_PLAN_UPGRADED' }),
        }),
      );
    });
  });
});
