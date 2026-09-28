import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MessagingService } from '../src/modules/messaging/messaging.service';
import { AutomationTriggerService } from '../src/modules/messaging/automation-trigger.service';
import { RewardsService } from '../src/modules/rewards/rewards.service';
import { MockWhatsAppProvider } from '../src/modules/messaging/providers/mock-whatsapp.provider';
import { JwtService } from '@nestjs/jwt';

describe('Phase 2 WhatsApp Automation & Security E2E Test Suite', () => {
  let app: INestApplication;
  let messagingService: MessagingService;
  let automationTriggerService: AutomationTriggerService;
  let rewardsService: RewardsService;
  let mockProvider: MockWhatsAppProvider;
  let jwtService: JwtService;

  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';
  const CANARY_GYM_ID = '99999999-9999-9999-9999-999999999999';

  const memberA = {
    id: 'member-a-1',
    gymId: GYM_A_ID,
    firstName: 'Hamza',
    lastName: 'Abbasi',
    phone: '+923001111111',
    memberCode: 'HA-001',
    status: 'ACTIVE',
    isOptedOut: false,
    optedOutAt: null,
    gym: { id: GYM_A_ID, name: 'Iron House Lahore', phone: '+924235750000' },
  };

  const memberB = {
    id: 'member-b-1',
    gymId: GYM_B_ID,
    firstName: 'Tariq',
    lastName: 'Mehmood',
    phone: '+923002222222',
    memberCode: 'TM-001',
    status: 'ACTIVE',
    isOptedOut: false,
    optedOutAt: null,
    gym: { id: GYM_B_ID, name: 'K-Town Crossfit Karachi', phone: '+922135000000' },
  };

  let mockMembers: any[] = [];
  let mockLogs: any[] = [];
  let tokenGymAOwner: string;

  beforeAll(async () => {
    mockMembers = [{ ...memberA }, { ...memberB }];
    mockLogs = [];
    mockProvider = new MockWhatsAppProvider();

    const mockPrismaService = {
      member: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return (
            mockMembers.find((m) => {
              if (where?.id && m.id !== where.id) return false;
              if (where?.gymId && m.gymId !== where.gymId) return false;
              if (where?.phone && m.phone !== where.phone) return false;
              return true;
            }) || null
          );
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return mockMembers.find((m) => m.id === where.id) || null;
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          return mockMembers.filter((m) => {
            if (where?.gymId && m.gymId !== where.gymId) return false;
            if (where?.isOptedOut !== undefined && m.isOptedOut !== where.isOptedOut) return false;
            return true;
          });
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = mockMembers.findIndex((m) => m.id === where.id);
          if (idx !== -1) {
            mockMembers[idx] = { ...mockMembers[idx], ...data };
            return mockMembers[idx];
          }
          return null;
        }),
      },
      whatsAppMessageLog: {
        create: jest.fn().mockImplementation(({ data }) => {
          const entry = {
            id: `log-${Date.now()}-${Math.random()}`,
            createdAt: new Date(),
            ...data,
          };
          mockLogs.push(entry);
          return entry;
        }),
        findFirst: jest.fn().mockImplementation(({ where }) => {
          return (
            mockLogs.find((l) => {
              if (where?.gymId && l.gymId !== where.gymId) return false;
              if (where?.memberId && l.memberId !== where.memberId) return false;
              if (where?.templateName && l.templateName !== where.templateName) return false;
              if (where?.providerMessageId && l.providerMessageId !== where.providerMessageId) return false;
              if (where?.status?.in && !where.status.in.includes(l.status)) return false;
              return true;
            }) || null
          );
        }),
        findMany: jest.fn().mockImplementation(({ where }) => {
          return mockLogs.filter((l) => {
            if (where?.gymId && l.gymId !== where.gymId) return false;
            return true;
          });
        }),
        count: jest.fn().mockImplementation(({ where }) => {
          return mockLogs.filter((l) => {
            if (where?.gymId && l.gymId !== where.gymId) return false;
            if (where?.memberId && l.memberId !== where.memberId) return false;
            return true;
          }).length;
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const idx = mockLogs.findIndex((l) => l.id === where.id);
          if (idx !== -1) {
            mockLogs[idx] = { ...mockLogs[idx], ...data };
            return mockLogs[idx];
          }
          return null;
        }),
      },
      gym: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where?.phone === '+924235750000') {
            return { id: GYM_A_ID, name: 'Iron House Lahore', phone: '+924235750000' };
          }
          return null;
        }),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where?.id === GYM_A_ID) return { id: GYM_A_ID, name: 'Iron House Lahore' };
          if (where?.id === GYM_B_ID) return { id: GYM_B_ID, name: 'K-Town Crossfit' };
          return null;
        }),
      },
      gymStaff: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'owner-a-uuid') {
            return { id: 'owner-a-uuid', gymId: GYM_A_ID, role: 'GYM_OWNER', isActive: true };
          }
          return null;
        }),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      reward: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      rewardRedemption: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider('MessagingProvider')
      .useValue(mockProvider)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    messagingService = moduleFixture.get<MessagingService>(MessagingService);
    automationTriggerService = moduleFixture.get<AutomationTriggerService>(AutomationTriggerService);
    rewardsService = moduleFixture.get<RewardsService>(RewardsService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    tokenGymAOwner = jwtService.sign(
      { sub: 'owner-a-uuid', email: 'owner@gyma.pk', role: 'GYM_OWNER', gymId: GYM_A_ID },
      { secret: process.env.JWT_SECRET || 'gymretain_test_jwt_secret' },
    );
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  beforeEach(() => {
    mockMembers = [{ ...memberA, isOptedOut: false, optedOutAt: null }, { ...memberB, isOptedOut: false, optedOutAt: null }];
    mockLogs = [];
    mockProvider.sentMessages = [];
  });

  // ==========================================
  // PRIORITY 1: SECURITY-SEVERITY TESTS
  // ==========================================

  it('1. Security: Inbound webhook rejects missing or invalid Twilio signature (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/messaging/whatsapp/inbound')
      .send({
        From: '+923001111111',
        Body: 'STREAK',
      });

    // Unsigned webhook must be rejected
    expect(res.status).toBe(401);
  });

  it('2. Security: Inbound webhook with valid test signature succeeds (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/messaging/whatsapp/inbound')
      .set('x-twilio-signature', 'valid-test-signature')
      .send({
        From: '+923001111111',
        Body: 'STREAK',
        To: '+924235750000',
      });

    expect(res.status).toBe(200);
    const data = res.body.data || res.body;
    expect(data.matchedKeyword).toBe('STREAK');
  });

  it('3. Security & Compliance: STOP keyword sets isOptedOut=true and suppresses outbound nudges', async () => {
    // Member texts STOP
    const inboundRes = await messagingService.handleInboundWhatsAppMessage(
      memberA.phone,
      'STOP',
      GYM_A_ID,
    );

    expect(inboundRes.matchedKeyword).toBe('STOP');
    expect(mockMembers.find((m) => m.id === memberA.id)?.isOptedOut).toBe(true);

    // Outbound automated nudge attempt MUST be suppressed
    const dispatchRes = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'missed_visit_nudge',
      parameters: { daysSince: '7', memberName: memberA.firstName },
    });

    expect(dispatchRes.success).toBe(false);
    expect(dispatchRes.suppressed).toBe(true);
    expect(dispatchRes.reason).toBe('MEMBER_OPTED_OUT');
    expect(mockProvider.sentMessages.length).toBe(0);
  });

  it('4. Security & Compliance: START keyword resubscribes opted-out member', async () => {
    mockMembers[0].isOptedOut = true;

    const res = await messagingService.handleInboundWhatsAppMessage(
      memberA.phone,
      'START',
      GYM_A_ID,
    );

    expect(res.matchedKeyword).toBe('START');
    expect(mockMembers.find((m) => m.id === memberA.id)?.isOptedOut).toBe(false);
  });

  it('5. Security & Isolation: Gym A cannot trigger automated messages for Gym B member', async () => {
    await expect(
      messagingService.sendAutomatedTemplateMessage({
        gymId: GYM_A_ID,
        memberId: memberB.id, // Foreign Gym B member
        templateName: 'streak_celebration',
        parameters: { streak: '10' },
      }),
    ).rejects.toThrow();

    expect(mockProvider.sentMessages.length).toBe(0);
  });

  // ==========================================
  // PRIORITY 2: CORRECTNESS & DEDUPLICATION TESTS
  // ==========================================

  it('6. Correctness: 24-Hour Deduplication suppresses repeated nudge triggers', async () => {
    // First send succeeds
    const firstSend = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'missed_visit_nudge',
      parameters: { daysSince: '5', memberName: memberA.firstName },
    });
    expect(firstSend.success).toBe(true);
    expect(mockProvider.sentMessages.length).toBe(1);

    // Second consecutive send within cooldown is suppressed
    const secondSend = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'missed_visit_nudge',
      parameters: { daysSince: '5', memberName: memberA.firstName },
    });

    expect(secondSend.success).toBe(false);
    expect(secondSend.suppressed).toBe(true);
    expect(secondSend.reason).toBe('COOLDOWN_ACTIVE');
    expect(mockProvider.sentMessages.length).toBe(1); // Provider not called twice
  });

  it('7. Correctness: Member daily cap prevents spam across different template types', async () => {
    // First message (streak celebration)
    const first = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'streak_celebration',
      parameters: { streak: '7' },
    });
    expect(first.success).toBe(true);

    // Different template (payment reminder) on the same day must be suppressed by member daily cap
    const second = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'payment_reminder',
      parameters: { planName: 'Monthly Gold', amountPaisa: '500000' },
    });

    expect(second.success).toBe(false);
    expect(second.suppressed).toBe(true);
    expect(second.reason).toBe('DAILY_MEMBER_CAP_REACHED');
  });

  // ==========================================
  // PRIORITY 3: FEATURES & COST VISIBILITY TESTS
  // ==========================================

  it('8. Feature: Delivery status webhook updates message log to DELIVERED', async () => {
    // Send a message first
    const sendRes = await messagingService.sendAutomatedTemplateMessage({
      gymId: GYM_A_ID,
      memberId: memberA.id,
      templateName: 'streak_celebration',
      parameters: { streak: '5' },
    });

    const providerId = sendRes.providerMessageId!;
    expect(providerId).toBeDefined();

    // Provider sends status callback
    const statusRes = await request(app.getHttpServer())
      .post('/api/v1/messaging/whatsapp/status')
      .set('x-twilio-signature', 'valid-test-signature')
      .send({
        MessageSid: providerId,
        MessageStatus: 'delivered',
      });

    expect(statusRes.status).toBe(200);

    // Verify DB log updated
    const updatedLog = mockLogs.find((l) => l.providerMessageId === providerId);
    expect(updatedLog.status).toBe('DELIVERED');
  });

  it('9. Feature: Cost visibility endpoint returns per-gym aggregated expenditures in PKR', async () => {
    // Insert 2 logs: 1 UTILITY (350 paisa) + 1 MARKETING (1250 paisa)
    mockLogs.push({
      id: 'log-1',
      gymId: GYM_A_ID,
      messageCategory: 'UTILITY',
      status: 'DELIVERED',
      costPaisa: 350,
      createdAt: new Date(),
    });
    mockLogs.push({
      id: 'log-2',
      gymId: GYM_A_ID,
      messageCategory: 'MARKETING',
      status: 'DELIVERED',
      costPaisa: 1250,
      createdAt: new Date(),
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/messaging/cost-summary?days=30')
      .set('Authorization', `Bearer ${tokenGymAOwner}`);

    expect(res.status).toBe(200);
    const summary = res.body.data?.summary || res.body.summary;
    expect(summary.totalMessages).toBe(2);
    expect(summary.utilityCount).toBe(1);
    expect(summary.marketingCount).toBe(1);
    expect(summary.totalCostPaisa).toBe(1600); // 350 + 1250 = 1600 paisa (16.00 PKR)
    expect(summary.totalCostPkr).toBe('16.00');
  });
});
