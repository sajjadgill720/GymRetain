import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TenantAccessGuard } from '../src/common/guards/tenant-access.guard';
import { MembersService } from '../src/modules/members/members.service';
import { CheckInsService } from '../src/modules/check-ins/check-ins.service';
import { SuperAdminPrismaService } from '../src/prisma/super-admin-prisma.service';
import { TrainersService } from '../src/modules/trainers/trainers.service';
import { DietPlansService } from '../src/modules/diet-plans/diet-plans.service';

describe('GymRetain Tenant Isolation Security Test Suite (Adversarial & Canary)', () => {
  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';
  const CANARY_GYM_ID = '99999999-9999-9999-9999-999999999999';

  describe('1. TenantAccessGuard - Cross-Tenant Request Scoping', () => {
    let guard: TenantAccessGuard;

    beforeEach(() => {
      guard = new TenantAccessGuard();
    });

    it('should REJECT gym staff attempting to access route params belonging to another gym (403)', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'staff-1',
              email: 'staff@gyma.pk',
              role: 'GYM_STAFF',
              gymId: GYM_A_ID,
            },
            params: {
              gymId: GYM_B_ID, // Target is Gym B!
            },
            headers: {},
            query: {},
            body: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should ALLOW gym staff accessing their own gym resources', () => {
      const mockRequest: any = {
        user: {
          sub: 'staff-1',
          email: 'staff@gyma.pk',
          role: 'GYM_STAFF',
          gymId: GYM_A_ID,
        },
        params: {
          gymId: GYM_A_ID,
        },
        headers: {},
        query: {},
        body: {},
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      const allowed = guard.canActivate(mockExecutionContext);
      expect(allowed).toBe(true);
      expect(mockRequest.tenantContext).toBeDefined();
      expect(mockRequest.tenantContext.gymId).toBe(GYM_A_ID);
    });
  });

  describe('2. Client-Side Gym_ID Session Tampering & Injection Attacks', () => {
    let guard: TenantAccessGuard;

    beforeEach(() => {
      guard = new TenantAccessGuard();
    });

    it('should REJECT an attacker trying to inject a foreign gym_id in the request body', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'staff-1',
              email: 'staff@gyma.pk',
              role: 'GYM_STAFF',
              gymId: GYM_A_ID,
            },
            body: {
              gymId: GYM_B_ID, // Tampered body
            },
            headers: {},
            query: {},
            params: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should REJECT an attacker trying to inject a foreign gym_id in query parameters', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'staff-1',
              email: 'staff@gyma.pk',
              role: 'GYM_STAFF',
              gymId: GYM_A_ID,
            },
            query: {
              gymId: GYM_B_ID, // Tampered query
            },
            headers: {},
            body: {},
            params: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should REJECT an attacker passing a foreign x-gym-id header as non-superadmin', () => {
      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            user: {
              sub: 'staff-1',
              email: 'staff@gyma.pk',
              role: 'GYM_STAFF',
              gymId: GYM_A_ID,
            },
            headers: {
              'x-gym-id': GYM_B_ID, // Spoofed header
            },
            query: {},
            body: {},
            params: {},
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(ForbiddenException);
    });

    it('should sanitize and strip any client body gymId parameter so it cannot override session', () => {
      const mockRequest: any = {
        user: {
          sub: 'staff-1',
          email: 'staff@gyma.pk',
          role: 'GYM_STAFF',
          gymId: GYM_A_ID,
        },
        body: {
          firstName: 'NewMember',
        },
        headers: {},
        query: {},
        params: {},
      };

      const mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as any;

      guard.canActivate(mockExecutionContext);
      expect(mockRequest.body.gymId).toBeUndefined();
      expect(mockRequest.tenantContext.gymId).toBe(GYM_A_ID);
    });
  });

  describe('3. Adversarial Direct Member ID Fetch (URL/API Call)', () => {
    let membersService: MembersService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        member: {
          findFirst: jest.fn(),
          update: jest.fn(),
        },
      };
      mockTenantPrisma = {
        runWithTenantRLS: jest.fn(),
      };
      membersService = new MembersService(mockPrisma, mockTenantPrisma);
    });

    it('should return 404 NotFoundException (NOT empty 200 or empty array) when Gym A queries Gym B member directly', async () => {
      const gymBMemberId = 'member-b-secret-uuid';

      // findFirst with where: { id: gymBMemberId, gymId: GYM_A_ID } yields null
      mockPrisma.member.findFirst.mockResolvedValue(null);

      // Must throw NotFoundException (404), never return 200 with null/empty object
      await expect(
        membersService.getMemberById(GYM_A_ID, gymBMemberId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: gymBMemberId, gymId: GYM_A_ID },
        }),
      );
    });

    it('should REJECT an attempt by Gym A to mutate Gym B member data', async () => {
      const gymBMemberId = 'member-b-secret-uuid';
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(
        membersService.updateMember(GYM_A_ID, gymBMemberId, { firstName: 'Compromised' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.member.update).not.toHaveBeenCalled();
    });
  });

  describe('4. Adversarial Cross-Tenant QR Check-In Attacks', () => {
    let checkInsService: CheckInsService;
    let mockPrisma: any;
    let mockTenantPrisma: any;
    let mockStreaks: any;
    let mockRewards: any;

    beforeEach(() => {
      mockPrisma = {
        gym: { findUnique: jest.fn() },
        member: { findFirst: jest.fn() },
      };
      mockTenantPrisma = { runWithTenantRLS: jest.fn() };
      mockStreaks = {};
      mockRewards = {};

      checkInsService = new CheckInsService(
        mockPrisma,
        mockTenantPrisma,
        mockStreaks,
        mockRewards,
      );
    });

    it('should REJECT check-in when Gym B QR code payload is scanned at Gym A (ForbiddenException)', async () => {
      const foreignQrPayload = JSON.stringify({
        gymId: GYM_B_ID, // QR belongs to Gym B!
        slug: 'ktown-crossfit',
        qrSecret: 'secret-gym-b',
        v: 1,
      });

      await expect(
        checkInsService.recordCheckIn(GYM_A_ID, {
          memberIdentifier: 'GR-1001',
          qrPayload: foreignQrPayload,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should REJECT check-in when scanned QR secret does not match Gym A secret', async () => {
      mockPrisma.gym.findUnique.mockResolvedValue({
        qrCodeSecret: 'authentic-gym-a-secret',
      });

      await expect(
        checkInsService.recordCheckIn(GYM_A_ID, {
          memberIdentifier: 'GR-1001',
          qrSecret: 'stolen-or-wrong-secret',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('5. Automated Canary Test Gym Regression Verification', () => {
    let membersService: MembersService;
    let checkInsService: CheckInsService;
    let trainersService: TrainersService;
    let dietPlansService: DietPlansService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        member: { findFirst: jest.fn().mockResolvedValue(null) },
        gym: { findUnique: jest.fn().mockResolvedValue({ qrCodeSecret: 'canary-secret' }) },
        gymStaff: { findFirst: jest.fn().mockResolvedValue(null) },
        trainerAssignment: { findFirst: jest.fn().mockResolvedValue(null) },
        dietPlan: { findFirst: jest.fn().mockResolvedValue(null) },
        dietPlanTemplate: { findFirst: jest.fn().mockResolvedValue(null) },
      };
      mockTenantPrisma = { runWithTenantRLS: jest.fn() };

      membersService = new MembersService(mockPrisma, mockTenantPrisma);
      checkInsService = new CheckInsService(mockPrisma, mockTenantPrisma, {} as any, {} as any);
      trainersService = new TrainersService(mockPrisma);
      dietPlansService = new DietPlansService(mockPrisma, {} as any);
    });

    it('CANARY REGRESSION CHECK: Attacker gym cannot read, write, or check-in canary member', async () => {
      const canaryMemberId = 'canary-member-001';
      const canaryMemberCode = 'CANARY-001';

      // 1. Cross-tenant read must fail (404)
      await expect(
        membersService.getMemberById(GYM_A_ID, canaryMemberId),
      ).rejects.toThrow(NotFoundException);

      // 2. Cross-tenant write must fail (404)
      await expect(
        membersService.updateMember(GYM_A_ID, canaryMemberId, { firstName: 'CanaryHacked' }),
      ).rejects.toThrow(NotFoundException);

      // 3. Cross-tenant check-in with Canary QR payload must fail (403)
      const canaryQrPayload = JSON.stringify({
        gymId: CANARY_GYM_ID,
        slug: 'canary-test-gym',
        qrSecret: 'canary-secret',
      });

      await expect(
        checkInsService.recordCheckIn(GYM_A_ID, {
          memberIdentifier: canaryMemberCode,
          qrPayload: canaryQrPayload,
        }),
      ).rejects.toThrow(ForbiddenException);

      // 4. Cross-tenant trainer assignment must fail (404)
      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: canaryMemberId,
          trainerId: 'trainer-in-gym-a',
        }),
      ).rejects.toThrow(NotFoundException);

      // 5. Cross-tenant diet plan creation must fail (404)
      await expect(
        dietPlansService.createDietPlan(GYM_A_ID, 'staff-in-gym-a', 'GYM_OWNER', {
          memberId: canaryMemberId,
          title: 'Canary Malicious Plan',
          goal: 'WEIGHT_LOSS',
          meals: [],
          sendWhatsAppNotification: false,
        }),
      ).rejects.toThrow(NotFoundException);

      // 6. Cross-tenant diet plan template clone must fail (404)
      await expect(
        dietPlansService.cloneFromTemplate(GYM_A_ID, 'staff-in-gym-a', 'GYM_OWNER', {
          templateId: 'canary-secret-template',
          memberId: 'member-in-gym-a',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('6. SuperAdminPrismaService - Audited Cross-Tenant Bypass Path', () => {
    let superAdminPrisma: SuperAdminPrismaService;
    let mockPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        $transaction: jest.fn(async (cb) => {
          const tx = {
            auditLog: { create: jest.fn() },
            $executeRawUnsafe: jest.fn(),
          };
          return cb(tx);
        }),
      };
      superAdminPrisma = new SuperAdminPrismaService(mockPrisma);
    });

    it('should DENY non-superadmin actors from calling the cross-tenant audited query path', async () => {
      const nonSuperAdminContext = {
        staffId: 'staff-123',
        actorRole: 'GYM_OWNER',
        action: 'EXPORT_ALL_GYMS_DATA',
        resource: 'MEMBERS',
      };

      await expect(
        superAdminPrisma.runAuditedCrossTenantQuery(
          nonSuperAdminContext,
          async () => ({ data: 'secret' }),
        ),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should audit every SUPER_ADMIN cross-tenant operation and set app.is_super_admin = true', async () => {
      const superAdminContext = {
        staffId: 'super-admin-1',
        actorRole: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_CROSS_GYM_METRICS_VIEW',
        resource: 'PLATFORM_AGGREGATE',
        ipAddress: '127.0.0.1',
      };

      let auditExecuted = false;
      let rawSqlExecuted: string[] = [];

      mockPrisma.$transaction = jest.fn(async (cb) => {
        const tx = {
          auditLog: {
            create: jest.fn().mockImplementation(() => {
              auditExecuted = true;
            }),
          },
          $executeRawUnsafe: jest.fn().mockImplementation((sql: string) => {
            rawSqlExecuted.push(sql);
          }),
        };
        return cb(tx);
      });

      const result = await superAdminPrisma.runAuditedCrossTenantQuery(
        superAdminContext,
        async () => {
          return { aggregateGyms: 5, totalRevenuePaisa: 50000000 };
        },
      );

      expect(auditExecuted).toBe(true);
      expect(rawSqlExecuted).toContain("SET LOCAL app.is_super_admin = 'true';");
      expect(result.aggregateGyms).toBe(5);
    });
  });
});
