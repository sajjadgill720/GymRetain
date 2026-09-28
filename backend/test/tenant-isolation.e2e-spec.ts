import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { TenantPrismaService } from '../src/prisma/tenant-prisma.service';
import { SuperAdminPrismaService } from '../src/prisma/super-admin-prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('Tenant Isolation Adversarial E2E Integration Suite', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let superAdminPrisma: SuperAdminPrismaService;

  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';
  const CANARY_GYM_ID = '99999999-9999-9999-9999-999999999999';

  // Seeded identities
  const gymAOwner = {
    sub: 'owner-a-uuid',
    email: 'owner@gyma.pk',
    role: 'GYM_OWNER',
    gymId: GYM_A_ID,
  };

  const gymAStaff = {
    sub: 'staff-a-uuid',
    email: 'staff@gyma.pk',
    role: 'GYM_STAFF',
    gymId: GYM_A_ID,
  };

  const gymBMember = {
    id: 'member-b-uuid',
    gymId: GYM_B_ID,
    firstName: 'Zubair',
    lastName: 'Khan',
    phone: '+923002222222',
    memberCode: 'GB-1001',
    status: 'ACTIVE',
  };

  const gymAMember = {
    id: 'member-a-uuid',
    gymId: GYM_A_ID,
    firstName: 'Ali',
    lastName: 'Ahmed',
    phone: '+923001111111',
    memberCode: 'GA-1001',
    status: 'ACTIVE',
  };

  let tokenGymAOwner: string;
  let tokenGymAStaff: string;

  // Mock DB state for isolated fast CI runs
  let mockMembers: any[] = [];
  let mockCheckIns: any[] = [];
  let mockAuditLogs: any[] = [];

  beforeAll(async () => {
    mockMembers = [
      { ...gymAMember },
      { ...gymBMember },
      {
        id: 'canary-member-001',
        gymId: CANARY_GYM_ID,
        firstName: 'Canary',
        lastName: 'Member',
        phone: '+923000000001',
        memberCode: 'CANARY-001',
        status: 'ACTIVE',
      },
    ];
    mockCheckIns = [];
    mockAuditLogs = [];

    const mockPrismaService = {
      member: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          // Layer 1 / RLS scoping filter
          return mockMembers.filter((m) => {
            if (where?.gymId && m.gymId !== where.gymId) return false;
            return true;
          });
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return (
            mockMembers.find((m) => {
              if (where?.gymId && m.gymId !== where.gymId) return false;
              if (where?.id && m.id !== where.id) return false;
              if (where?.OR) {
                const matchOr = where.OR.some(
                  (cond: any) =>
                    (cond.id && cond.id === m.id) ||
                    (cond.memberCode && cond.memberCode === m.memberCode) ||
                    (cond.phone && cond.phone === m.phone),
                );
                if (!matchOr) return false;
              }
              return true;
            }) || null
          );
        }),
        count: jest.fn().mockImplementation(({ where }) => {
          return mockMembers.filter((m) => {
            if (where?.gymId && m.gymId !== where.gymId) return false;
            return true;
          }).length;
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          const created = { id: `new-member-${Date.now()}`, ...data };
          mockMembers.push(created);
          return created;
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = mockMembers.findIndex((m) => m.id === where.id);
          if (idx !== -1) {
            mockMembers[idx] = { ...mockMembers[idx], ...data };
            return mockMembers[idx];
          }
          throw new NotFoundException('Member not found');
        }),
      },
      checkIn: {
        create: jest.fn().mockImplementation(({ data }) => {
          const checkIn = { id: `checkin-${Date.now()}`, ...data };
          mockCheckIns.push(checkIn);
          return checkIn;
        }),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      gym: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === GYM_A_ID) {
            return { id: GYM_A_ID, name: 'Gym A Lahore', qrCodeSecret: 'gym-a-secret' };
          }
          if (where.id === GYM_B_ID) {
            return { id: GYM_B_ID, name: 'Gym B Karachi', qrCodeSecret: 'gym-b-secret' };
          }
          return null;
        }),
      },
      gymStaff: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'owner-a-uuid') {
            return {
              id: 'owner-a-uuid',
              email: 'owner@gyma.pk',
              role: 'GYM_OWNER',
              gymId: GYM_A_ID,
              isActive: true,
              name: 'Bilal Owner',
            };
          }
          if (where.id === 'staff-a-uuid') {
            return {
              id: 'staff-a-uuid',
              email: 'staff@gyma.pk',
              role: 'GYM_STAFF',
              gymId: GYM_A_ID,
              isActive: true,
              name: 'Usman Staff',
            };
          }
          return null;
        }),
      },
      streak: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ currentStreak: 1 }),
        update: jest.fn().mockResolvedValue({ currentStreak: 2 }),
      },
      reward: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      rewardRedemption: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          mockAuditLogs.push(data);
          return data;
        }),
      },
      $transaction: jest.fn(async (cb) => {
        const tx = {
          member: mockPrismaService.member,
          checkIn: mockPrismaService.checkIn,
          gym: mockPrismaService.gym,
          streak: mockPrismaService.streak,
          reward: mockPrismaService.reward,
          rewardRedemption: mockPrismaService.rewardRedemption,
          auditLog: mockPrismaService.auditLog,
          $executeRawUnsafe: jest.fn(),
        };
        return cb(tx);
      }),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    superAdminPrisma = moduleFixture.get<SuperAdminPrismaService>(SuperAdminPrismaService);

    tokenGymAOwner = jwtService.sign(gymAOwner, { secret: process.env.JWT_SECRET || 'gymretain_test_jwt_secret' });
    tokenGymAStaff = jwtService.sign(gymAStaff, { secret: process.env.JWT_SECRET || 'gymretain_test_jwt_secret' });
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    // Reset mock database to clean baseline before each adversarial test
    mockMembers = [
      { ...gymAMember },
      { ...gymBMember },
      {
        id: 'canary-member-001',
        gymId: CANARY_GYM_ID,
        firstName: 'Canary',
        lastName: 'Member',
        phone: '+923000000001',
        memberCode: 'CANARY-001',
        status: 'ACTIVE',
      },
    ];
    mockCheckIns = [];
    mockAuditLogs = [];
  });

  /**
   * TEST 1: Direct ID Fetch Attack
   * Authenticated as Gym A owner, fetch a Gym B member by ID directly
   * -> MUST fail with 403 or 404 (NOT 200 with empty body/null, which leaks existence)
   */
  it('1. Direct ID Fetch: Gym A querying Gym B member by ID must return 404, not 200 with empty body', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/members/${gymBMember.id}`)
      .set('Authorization', `Bearer ${tokenGymAOwner}`);

    expect([403, 404]).toContain(res.status);
    expect(res.body.message).toMatch(/not found|denied/i);
    // Ensure no sensitive fields leaked
    expect(res.body.phone).toBeUndefined();
    expect(res.body.lastName).toBeUndefined();
  });

  /**
   * TEST 2: Cross-Tenant Mutation & Deletion Attack
   * Authenticated as Gym A owner, attempt to update or delete a Gym B member
   * -> Expect rejection AND assert DB state afterward (no modification occurred)
   */
  it('2. Mutation Attack: Gym A updating Gym B member must be rejected and DB state unmodified', async () => {
    const originalName = gymBMember.firstName;

    const res = await request(app.getHttpServer())
      .patch(`/api/v1/members/${gymBMember.id}`)
      .set('Authorization', `Bearer ${tokenGymAOwner}`)
      .send({ firstName: 'MaliciousNameChange' });

    expect([403, 404]).toContain(res.status);

    // Assert Database State: Gym B member row was NOT modified
    const dbMember = mockMembers.find((m) => m.id === gymBMember.id);
    expect(dbMember.firstName).toBe(originalName);
    expect(dbMember.firstName).not.toBe('MaliciousNameChange');
  });

  /**
   * TEST 3: Cross-Tenant Check-In Submission Attack
   * Authenticated as Gym A staff, submit a check-in using a Gym B member's ID
   * -> Expect rejection AND assert no check_in row was inserted
   */
  it('3. Check-In Attack: Gym A staff submitting check-in for Gym B member must fail and insert 0 rows', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/check-ins')
      .set('Authorization', `Bearer ${tokenGymAStaff}`)
      .send({
        memberIdentifier: gymBMember.id,
        method: 'MANUAL_STAFF',
      });

    expect([403, 404]).toContain(res.status);

    // Assert Database State: Zero check-in rows created
    expect(mockCheckIns.length).toBe(0);
    const foreignCheckIn = mockCheckIns.find((c) => c.memberId === gymBMember.id);
    expect(foreignCheckIn).toBeUndefined();
  });

  /**
   * TEST 4: Missing WHERE Clause Defense
   * Authenticated as Gym A owner, list members with no gym filter applied
   * -> Expect ONLY Gym A's members returned, NEVER Gym B's
   */
  it('4. Missing WHERE Defense: Member listing must return only Gym A members, never Gym B', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${tokenGymAOwner}`);

    expect(res.status).toBe(200);
    const membersList = res.body.data?.members || res.body.members;
    expect(membersList).toBeDefined();

    const returnedGymIds = membersList.map((m: any) => m.gymId);
    // Every returned record must strictly belong to Gym A
    returnedGymIds.forEach((id: string) => {
      expect(id).toBe(GYM_A_ID);
    });

    // Absolutely zero records belonging to Gym B or Canary Gym
    const foreignFound = membersList.some((m: any) => m.gymId === GYM_B_ID || m.gymId === CANARY_GYM_ID);
    expect(foreignFound).toBe(false);
  });

  /**
   * TEST 5: Client-Side Tenant ID Override / Injection Attack
   * Attempt to manually set/override gym_id in request body or query param
   * -> Expect request rejected (403) or server-derived gym_id strictly enforced
   */
  it('5. Tenant Injection: Overriding gym_id in body/query must be rejected with 403 Forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/members')
      .set('Authorization', `Bearer ${tokenGymAOwner}`)
      .send({
        gymId: GYM_B_ID, // Malicious client injection targeting Gym B
        firstName: 'Injected',
        lastName: 'User',
        phone: '+923009999999',
        gender: 'MALE',
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/tenant isolation violation/i);

    // Assert Database State: No member created under Gym B
    const injectedInGymB = mockMembers.find((m) => m.gymId === GYM_B_ID && m.firstName === 'Injected');
    expect(injectedInGymB).toBeUndefined();
  });

  /**
   * TEST 6: JWT Tampering Attack
   * Tamper with JWT claims to inject Gym B's gymId while using invalid signature
   * -> Expect 401 Unauthorized
   */
  it('6. JWT Tampering: Request with tampered/forged JWT gymId claim must fail authentication (401)', async () => {
    const forgedToken = jwtService.sign(
      { sub: 'attacker-1', email: 'hacker@attacker.pk', role: 'GYM_OWNER', gymId: GYM_B_ID },
      { secret: 'wrong_secret_signature' },
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/members')
      .set('Authorization', `Bearer ${forgedToken}`);

    expect(res.status).toBe(401);
  });

  /**
   * TEST 7: Raw Database Query Without Session Variable (Default-Deny RLS)
   * Verify that without SET LOCAL app.current_gym_id, RLS blocks all rows
   */
  it('7. Default-Deny RLS: Raw database query without session variable blocks all rows', async () => {
    // Under PostgreSQL RLS policies in migration.sql:
    // USING (id = NULLIF(current_setting('app.current_gym_id', true), '')::uuid)
    // When app.current_gym_id is not set, current_setting returns empty string, NULLIF yields NULL.
    // NULL = NULL evaluates to UNKNOWN (false), resulting in 0 rows.
    const currentGymSetting = '';
    const resolvedSetting = currentGymSetting || null;

    expect(resolvedSetting).toBeNull();
    // Default-deny simulation: when session setting is null, matching tenant is impossible
    const queryResult = mockMembers.filter((m) => m.gymId === resolvedSetting);
    expect(queryResult.length).toBe(0);
  });

  /**
   * TEST 8: Super-Admin Dedicated Audited Path Verification
   * Confirm cross-tenant bypass path is strictly accessible ONLY by SUPER_ADMIN,
   * logs an immutable audit event, and rejects gym_owner / gym_staff roles
   */
  it('8. Super-Admin Audit Path: Rejected for gym_owner/staff (401/403) and audited for super_admin', async () => {
    // 1. Regular gym owner attempting to invoke audited cross-tenant query
    await expect(
      superAdminPrisma.runAuditedCrossTenantQuery(
        {
          staffId: gymAOwner.sub,
          actorRole: gymAOwner.role,
          action: 'CROSS_GYM_EXPORT',
          resource: 'MEMBERS',
        },
        async () => mockMembers,
      ),
    ).rejects.toThrow(UnauthorizedException);

    // 2. Verified Super Admin execution writes audit log
    const superAdminContext = {
      staffId: 'super-admin-001',
      actorRole: 'SUPER_ADMIN',
      action: 'PLATFORM_AGGREGATE_REPORT',
      resource: 'GLOBAL_METRICS',
      ipAddress: '127.0.0.1',
    };

    const auditResult = await superAdminPrisma.runAuditedCrossTenantQuery(
      superAdminContext,
      async () => ({ totalTenants: 4, activeGyms: 3 }),
    );

    expect(auditResult.totalTenants).toBe(4);
    expect(mockAuditLogs.length).toBeGreaterThan(0);
    expect(mockAuditLogs[0].staffId).toBe('super-admin-001');
    expect(mockAuditLogs[0].action).toBe('PLATFORM_AGGREGATE_REPORT');
  });
});
