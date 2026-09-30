import { NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService, DAILY_GYM_MESSAGE_LIMIT } from '../src/modules/chat/chat.service';

describe('ChatService - AI Insights Streaming & Tenant Scoping Tests', () => {
  let chatService: ChatService;
  let mockPrisma: any;
  let mockRetentionService: any;

  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';
  const USER_A_ID = 'staff-owner-a-id';

  beforeEach(() => {
    mockPrisma = {
      gym: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === GYM_A_ID) {
            return {
              id: GYM_A_ID,
              name: 'Iron House Gym & Fitness',
              currency: 'PKR',
              timezone: 'Asia/Karachi',
              address: 'Gulberg, Lahore',
            };
          }
          if (where.id === GYM_B_ID) {
            return {
              id: GYM_B_ID,
              name: 'K-Town Crossfit',
              currency: 'PKR',
              timezone: 'Asia/Karachi',
              address: 'Clifton, Karachi',
            };
          }
          return null;
        }),
      },
      member: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.gymId === GYM_A_ID) return 142;
          if (where.gymId === GYM_B_ID) return 95;
          return 0;
        }),
      },
      checkIn: {
        count: jest.fn().mockImplementation(({ where }) => {
          if (where.gymId === GYM_A_ID) return 520;
          if (where.gymId === GYM_B_ID) return 310;
          return 0;
        }),
      },
      streak: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.gymId === GYM_A_ID) {
            return [
              {
                currentStreak: 12,
                longestStreak: 12,
                member: { memberCode: 'GR-1001' },
              },
            ];
          }
          return [];
        }),
      },
      membership: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.gymId === GYM_A_ID) {
            return [{ price: 500000 }, { price: 650000 }];
          }
          return [];
        }),
      },
      chatConversation: {
        findFirst: jest.fn(),
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'conv-new-123',
          ...data,
        })),
        findMany: jest.fn(),
        delete: jest.fn(),
      },
      chatMessage: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'msg-new-123',
          ...data,
          createdAt: new Date(),
        })),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    mockRetentionService = {
      getAtRiskMembers: jest.fn().mockImplementation((gymId: string) => {
        if (gymId === GYM_A_ID) {
          return [
            {
              memberCode: 'GR-1002',
              riskScore: 88,
              riskLevel: 'HIGH',
              factors: {
                daysSinceLastCheckIn: 16,
                frequencyDropPercentage: 100,
                isPaymentOverdue: true,
                isRecentlyBrokenStreak: true,
              },
            },
          ];
        }
        return [];
      }),
    };

    chatService = new ChatService(mockPrisma, mockRetentionService);
  });

  describe('1. Privacy & Scrubbing of Personal User Data (PII)', () => {
    it('should NEVER include personal details (full names, phone numbers, emails) in the context block', async () => {
      const { summaryText } = await chatService.buildGymContext(GYM_A_ID);

      // Must NOT contain personal identifying information
      expect(summaryText).not.toContain('Hamza');
      expect(summaryText).not.toContain('Ayesha');
      expect(summaryText).not.toContain('Sheikh');
      expect(summaryText).not.toContain('Malik');
      expect(summaryText).not.toContain('+92');
      expect(summaryText).not.toContain('@');

      // MUST contain anonymized codes and operational metrics
      expect(summaryText).toContain('Member #GR-1001');
      expect(summaryText).toContain('Member #GR-1002');
      expect(summaryText).toContain('142'); // Total active members
      expect(summaryText).toContain('520'); // Check-ins
    });
  });

  describe('2. Multi-Tenant Scoping & Adversarial Injection Resistance', () => {
    it('should strictly query ONLY Gym A data when gymId is GYM_A_ID', async () => {
      const { gymName, summaryText } = await chatService.buildGymContext(GYM_A_ID);

      expect(gymName).toBe('Iron House Gym & Fitness');
      expect(summaryText).toContain('GYM METRICS FOR: Iron House Gym & Fitness');
      expect(summaryText).not.toContain('K-Town Crossfit');

      // Verify Prisma counts were called with gymId: GYM_A_ID
      expect(mockPrisma.member.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ gymId: GYM_A_ID }) }),
      );
      expect(mockPrisma.checkIn.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ gymId: GYM_A_ID }) }),
      );
    });

    it('should reject access when Gym A attempts to load Gym B conversation messages (NotFoundException)', async () => {
      // Conversation belongs to Gym B, but queried by Gym A
      mockPrisma.chatConversation.findFirst.mockResolvedValue(null);

      await expect(
        chatService.getMessages(GYM_A_ID, 'conv-belonging-to-gym-b'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('3. Streaming SSE Functionality & Token Chunking', () => {
    it('should stream Server-Sent Events with correct headers, progressive data chunks, and done indicator', async () => {
      const chunksWritten: string[] = [];
      const headersSet: Record<string, string> = {};

      const mockRes: any = {
        setHeader: jest.fn((k, v) => {
          headersSet[k] = v;
        }),
        flushHeaders: jest.fn(),
        write: jest.fn((data: string) => {
          chunksWritten.push(data);
        }),
        end: jest.fn(),
      };

      await chatService.streamChatMessage(
        GYM_A_ID,
        USER_A_ID,
        'Why is retention at risk this week?',
        undefined,
        mockRes,
      );

      // Verify SSE Headers
      expect(headersSet['Content-Type']).toBe('text/event-stream');
      expect(headersSet['Connection']).toBe('keep-alive');
      expect(headersSet['Cache-Control']).toContain('no-cache');

      // Verify progressive token chunks were emitted
      expect(chunksWritten.length).toBeGreaterThan(5);
      const firstChunk = JSON.parse(chunksWritten[0].replace('data: ', '').trim());
      expect(firstChunk.chunk).toBeDefined();

      // Verify done event was emitted
      const lastChunk = JSON.parse(
        chunksWritten[chunksWritten.length - 1].replace('data: ', '').trim(),
      );
      expect(lastChunk.done).toBe(true);
      expect(lastChunk.conversationId).toBeDefined();

      // Verify stream was terminated
      expect(mockRes.end).toHaveBeenCalled();

      // Verify messages were persisted in database
      expect(mockPrisma.chatMessage.create).toHaveBeenCalledTimes(2); // 1 user, 1 assistant
    });
  });

  describe('4. Rate Limiting Protection', () => {
    it('should enforce daily message cap and throw 429 Too Many Requests when limit exceeded', () => {
      // Simulate exhausting rate limit
      for (let i = 0; i < DAILY_GYM_MESSAGE_LIMIT; i++) {
        chatService.checkRateLimit(GYM_A_ID);
      }

      // Query limit + 1 must throw 429
      expect(() => chatService.checkRateLimit(GYM_A_ID)).toThrow(HttpException);
      try {
        chatService.checkRateLimit(GYM_A_ID);
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
        expect(err.message).toContain('limit of 50 queries reached');
      }
    });
  });
});
