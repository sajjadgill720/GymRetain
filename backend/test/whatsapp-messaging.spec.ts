import { MessagingService } from '../src/modules/messaging/messaging.service';

describe('MessagingService - WhatsApp Keyword & Dynamic Copy Engine', () => {
  let messagingService: MessagingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      member: {
        findFirst: jest.fn(),
      },
    };
    messagingService = new MessagingService(mockPrisma);
  });

  describe('1. Dynamic Non-Repetitive Streak Copy', () => {
    it('should generate varied message copy across consecutive days to prevent Meta template fatigue', () => {
      const day1 = messagingService.getDynamicStreakMessage('Hamza', 1, 'Iron House Gym');
      const day2 = messagingService.getDynamicStreakMessage('Hamza', 2, 'Iron House Gym');
      const day3 = messagingService.getDynamicStreakMessage('Hamza', 3, 'Iron House Gym');
      const day4 = messagingService.getDynamicStreakMessage('Hamza', 4, 'Iron House Gym');
      const day5 = messagingService.getDynamicStreakMessage('Hamza', 5, 'Iron House Gym');

      expect(day1).not.toEqual(day2);
      expect(day2).not.toEqual(day3);
      expect(day3).not.toEqual(day4);
      expect(day4).not.toEqual(day5);

      expect(day1).toContain('Momentum is everything');
      expect(day2).toContain('Unstoppable');
      expect(day3).toContain('Day 3 in the books');
    });
  });

  describe('2. Inbound WhatsApp Keyword Handler (Member Self-Service)', () => {
    it('should reply with personal streak stats when member texts "STREAK"', async () => {
      mockPrisma.member.findFirst.mockResolvedValue({
        id: 'mem-1',
        firstName: 'Hamza',
        lastName: 'Sheikh',
        phone: '+923009876543',
        gym: { name: 'Iron House Gym & Fitness', phone: '+924235750000' },
        streak: { currentStreak: 12, longestStreak: 12 },
        memberships: [{ planName: 'Monthly Gold', status: 'ACTIVE' }],
      });

      const response = await messagingService.handleInboundWhatsAppMessage(
        '+923009876543',
        'STREAK',
      );

      expect(response.matchedKeyword).toBe('STREAK');
      expect(response.reply).toContain('12 consecutive days');
      expect(response.reply).toContain('Iron House Gym & Fitness');
      expect(response.reply).toContain('Monthly Gold');
      expect(response.member?.currentStreak).toBe(12);
    });

    it('should reply with invitation message when phone number is not found', async () => {
      mockPrisma.member.findFirst.mockResolvedValue(null);

      const response = await messagingService.handleInboundWhatsAppMessage(
        '+923009999999',
        'STREAK',
      );

      expect(response.matchedKeyword).toBe('UNKNOWN_MEMBER');
      expect(response.reply).toContain('not registered');
    });
  });
});
