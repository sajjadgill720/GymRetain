import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { TenantAccessGuard } from '../src/common/guards/tenant-access.guard';
import { MembersService } from '../src/modules/members/members.service';
import { SuperAdminPrismaService } from '../src/prisma/super-admin-prisma.service';

describe('GymRetain Tenant Isolation Security Test Suite', () => {
  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';

  describe('1. TenantAccessGuard - Cross-Tenant Request Scoping', () => {
    let guard: TenantAccessGuard;

    beforeEach(() => {
      guard = new TenantAccessGuard();
    });

    it('should REJECT a gym staff/owner attempting to access route params belonging to another gym', () => {
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
          }),
        }),
      } as any;

      expect(() => guard.canActivate(mockExecutionContext)).toThrow(
        ForbiddenException,
      );
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

  describe('2. MembersService - Application-Level Cross-Tenant Query Scoping', () => {
    let membersService: MembersService;
    let mockPrisma: any;
    let mockTenantPrisma: any;

    beforeEach(() => {
      mockPrisma = {
        member: {
          findFirst: jest.fn(),
          findMany: jest.fn(),
          count: jest.fn(),
          update: jest.fn(),
        },
      };
      mockTenantPrisma = {
        runWithTenantRLS: jest.fn(),
      };
      membersService = new MembersService(mockPrisma, mockTenantPrisma);
    });

    it('should NOT allow Gym A to read a member belonging to Gym B (throws NotFoundException)', async () => {
      const memberBId = 'member-b-id';

      // Prisma query includes `where: { id: memberBId, gymId: GYM_A_ID }` which returns null
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(
        membersService.getMemberById(GYM_A_ID, memberBId),
      ).rejects.toThrow(NotFoundException);

      // Verify that query was strictly scoped to Gym A
      expect(mockPrisma.member.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: memberBId, gymId: GYM_A_ID },
        }),
      );
    });

    it('should NOT allow Gym A to update or deactivate a member belonging to Gym B', async () => {
      const memberBId = 'member-b-id';
      mockPrisma.member.findFirst.mockResolvedValue(null);

      await expect(
        membersService.updateMember(GYM_A_ID, memberBId, { firstName: 'Hacked' }),
      ).rejects.toThrow(NotFoundException);

      await expect(
        membersService.deactivateMember(GYM_A_ID, memberBId),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrisma.member.update).not.toHaveBeenCalled();
    });
  });

  describe('3. SuperAdminPrismaService - Audited Cross-Tenant Bypass Path', () => {
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
        actorRole: 'GYM_OWNER', // Not SUPER_ADMIN
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
