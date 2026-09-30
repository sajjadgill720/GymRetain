import {
  DashboardSummary,
  AttendanceTrendPoint,
  MemberRiskDetails,
  Member,
  Reward,
  RewardRedemption,
  CheckIn,
  User,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

// Default mock data for local demo testing when backend DB is offline
const MOCK_SUMMARY: DashboardSummary = {
  kpis: {
    activeMembers: 142,
    todayCheckIns: 38,
    atRiskMembersTotal: 19,
    highRiskCount: 6,
    mediumRiskCount: 13,
  },
  streakLeaders: [
    {
      memberId: 'mem-1',
      memberName: 'Hamza Sheikh',
      memberCode: 'GR-1001',
      currentStreak: 12,
      longestStreak: 12,
    },
    {
      memberId: 'mem-3',
      memberName: 'Zaid Siddiqui',
      memberCode: 'GR-1003',
      currentStreak: 9,
      longestStreak: 14,
    },
    {
      memberId: 'mem-4',
      memberName: 'Fatima Zahra',
      memberCode: 'GR-1004',
      currentStreak: 7,
      longestStreak: 7,
    },
    {
      memberId: 'mem-5',
      memberName: 'Bilal Ahmed',
      memberCode: 'GR-1005',
      currentStreak: 6,
      longestStreak: 10,
    },
    {
      memberId: 'mem-6',
      memberName: 'Ali Raza',
      memberCode: 'GR-1006',
      currentStreak: 5,
      longestStreak: 5,
    },
  ],
  recentAtRiskPreview: [
    {
      memberId: 'mem-2',
      memberCode: 'GR-1002',
      fullName: 'Ayesha Malik',
      phone: '+923331122334',
      riskScore: 88,
      riskLevel: 'HIGH',
      factors: {
        daysSinceLastCheckIn: 16,
        daysInactiveScore: 80,
        weeklyVisitsCurrent: 0,
        fourWeekRollingAvg: 3.5,
        frequencyDropPercentage: 100,
        frequencyDropScore: 100,
        isPaymentOverdue: true,
        paymentOverdueScore: 100,
        isRecentlyBrokenStreak: true,
        brokenStreakScore: 100,
      },
    },
    {
      memberId: 'mem-7',
      memberCode: 'GR-1007',
      fullName: 'Omer Farooq',
      phone: '+923005544332',
      riskScore: 78,
      riskLevel: 'HIGH',
      factors: {
        daysSinceLastCheckIn: 12,
        daysInactiveScore: 80,
        weeklyVisitsCurrent: 0,
        fourWeekRollingAvg: 2.8,
        frequencyDropPercentage: 100,
        frequencyDropScore: 100,
        isPaymentOverdue: false,
        paymentOverdueScore: 0,
        isRecentlyBrokenStreak: true,
        brokenStreakScore: 100,
      },
    },
    {
      memberId: 'mem-8',
      memberCode: 'GR-1008',
      fullName: 'Sana Tariq',
      phone: '+923219988776',
      riskScore: 56,
      riskLevel: 'MEDIUM',
      factors: {
        daysSinceLastCheckIn: 6,
        daysInactiveScore: 50,
        weeklyVisitsCurrent: 1,
        fourWeekRollingAvg: 3.2,
        frequencyDropPercentage: 68,
        frequencyDropScore: 80,
        isPaymentOverdue: true,
        paymentOverdueScore: 100,
        isRecentlyBrokenStreak: false,
        brokenStreakScore: 0,
      },
    },
  ],
};

const generateMockTrends = (days: number): AttendanceTrendPoint[] => {
  const result: AttendanceTrendPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const base = isWeekend ? 22 : 36;
    const randomVariation = Math.floor(Math.sin(i * 0.4) * 8) + Math.floor(Math.random() * 6);
    result.push({
      date: dateStr,
      checkIns: Math.max(10, base + randomVariation),
    });
  }
  return result;
};

const MOCK_REWARDS: Reward[] = [
  {
    id: 'rew-1',
    gymId: 'gym-1',
    title: '10-Day Streak Warrior',
    description: 'Awarded for checking in 10 consecutive days without missing a day!',
    rewardType: 'BADGE',
    triggerType: 'STREAK_MILESTONE',
    triggerThreshold: 10,
    badgeIcon: 'flame-gold',
    isActive: true,
    _count: { redemptions: 14 },
  },
  {
    id: 'rew-2',
    gymId: 'gym-1',
    title: 'Free Whey Protein Shake',
    description: 'Redeemable at the reception juice bar for hitting a 15-day streak.',
    rewardType: 'FREE_ITEM',
    triggerType: 'STREAK_MILESTONE',
    triggerThreshold: 15,
    badgeIcon: 'cup-shake',
    isActive: true,
    _count: { redemptions: 8 },
  },
  {
    id: 'rew-3',
    gymId: 'gym-1',
    title: '20% Next Month Discount',
    description: 'Special 20% discount on renewal for 25 consecutive workout days.',
    rewardType: 'DISCOUNT_PERCENT',
    triggerType: 'STREAK_MILESTONE',
    triggerThreshold: 25,
    rewardValue: 20,
    badgeIcon: 'percent-circle',
    isActive: true,
    _count: { redemptions: 3 },
  },
];

export const MOCK_WINNERS: RewardRedemption[] = [
  {
    id: 'red-1',
    rewardId: 'rew-1',
    memberId: 'mem-1',
    status: 'REDEEMED',
    unlockedAt: '2026-09-25T10:30:00Z',
    redeemedAt: '2026-09-27T11:15:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-1',
      gymId: 'gym-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
      joinDate: '2026-07-28',
      status: 'ACTIVE',
      streak: {
        id: 'st-1',
        currentStreak: 12,
        longestStreak: 12,
      },
    },
  },
  {
    id: 'red-2',
    rewardId: 'rew-2',
    memberId: 'mem-1',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-28T09:12:00Z',
    reward: {
      id: 'rew-2',
      gymId: 'gym-1',
      title: 'Free Whey Protein Shake',
      description: 'Redeemable at the reception juice bar for hitting a 15-day streak.',
      rewardType: 'FREE_ITEM',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 15,
      badgeIcon: 'cup-shake',
      isActive: true,
    },
    member: {
      id: 'mem-1',
      gymId: 'gym-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
      joinDate: '2026-07-28',
      status: 'ACTIVE',
      streak: {
        id: 'st-1',
        currentStreak: 12,
        longestStreak: 12,
      },
    },
  },
  {
    id: 'red-3',
    rewardId: 'rew-1',
    memberId: 'mem-3',
    status: 'REDEEMED',
    unlockedAt: '2026-09-20T14:40:00Z',
    redeemedAt: '2026-09-21T08:00:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-3',
      gymId: 'gym-1',
      memberCode: 'GR-1003',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      phone: '+923129988776',
      joinDate: '2026-08-15',
      status: 'ACTIVE',
      streak: {
        id: 'st-3',
        currentStreak: 9,
        longestStreak: 14,
      },
    },
  },
  {
    id: 'red-4',
    rewardId: 'rew-1',
    memberId: 'mem-4',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-28T16:20:00Z',
    reward: {
      id: 'rew-1',
      gymId: 'gym-1',
      title: '10-Day Streak Warrior',
      description: 'Awarded for checking in 10 consecutive days without missing a day!',
      rewardType: 'BADGE',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 10,
      badgeIcon: 'flame-gold',
      isActive: true,
    },
    member: {
      id: 'mem-4',
      gymId: 'gym-1',
      memberCode: 'GR-1004',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+923214455667',
      joinDate: '2026-09-01',
      status: 'ACTIVE',
      streak: {
        id: 'st-4',
        currentStreak: 7,
        longestStreak: 10,
      },
    },
  },
  {
    id: 'red-5',
    rewardId: 'rew-3',
    memberId: 'mem-5',
    status: 'UNLOCKED',
    unlockedAt: '2026-09-29T08:15:00Z',
    reward: {
      id: 'rew-3',
      gymId: 'gym-1',
      title: '20% Next Month Discount',
      description: 'Special 20% discount on renewal for 25 consecutive workout days.',
      rewardType: 'DISCOUNT_PERCENT',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 25,
      rewardValue: 20,
      badgeIcon: 'percent-circle',
      isActive: true,
    },
    member: {
      id: 'mem-5',
      gymId: 'gym-1',
      memberCode: 'GR-1005',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      phone: '+923456677889',
      joinDate: '2026-05-10',
      status: 'ACTIVE',
      streak: {
        id: 'st-5',
        currentStreak: 6,
        longestStreak: 25,
      },
    },
  },
  {
    id: 'red-6',
    rewardId: 'rew-2',
    memberId: 'mem-6',
    status: 'REDEEMED',
    unlockedAt: '2026-09-22T12:00:00Z',
    redeemedAt: '2026-09-23T10:45:00Z',
    reward: {
      id: 'rew-2',
      gymId: 'gym-1',
      title: 'Free Whey Protein Shake',
      description: 'Redeemable at the reception juice bar for hitting a 15-day streak.',
      rewardType: 'FREE_ITEM',
      triggerType: 'STREAK_MILESTONE',
      triggerThreshold: 15,
      badgeIcon: 'cup-shake',
      isActive: true,
    },
    member: {
      id: 'mem-6',
      gymId: 'gym-1',
      memberCode: 'GR-1006',
      firstName: 'Ali',
      lastName: 'Raza',
      phone: '+923157788990',
      joinDate: '2026-07-01',
      status: 'ACTIVE',
      streak: {
        id: 'st-6',
        currentStreak: 5,
        longestStreak: 15,
      },
    },
  },
];

const MOCK_MEMBERS: Member[] = [
  {
    id: 'mem-1',
    gymId: 'gym-1',
    memberCode: 'GR-1001',
    firstName: 'Hamza',
    lastName: 'Sheikh',
    phone: '+923009876543',
    email: 'hamza.sheikh@gmail.com',
    gender: 'MALE',
    joinDate: '2026-07-28',
    status: 'ACTIVE',
    streak: {
      id: 'st-1',
      currentStreak: 12,
      longestStreak: 12,
      lastCheckInDate: new Date().toISOString(),
    },
    memberships: [
      {
        id: 'ms-1',
        planName: 'Monthly Gold',
        planType: 'MONTHLY',
        price: 650000,
        currency: 'PKR',
        startDate: '2026-09-15',
        endDate: '2026-10-15',
        status: 'ACTIVE',
      },
    ],
    _count: { checkIns: 48 },
  },
  {
    id: 'mem-2',
    gymId: 'gym-1',
    memberCode: 'GR-1002',
    firstName: 'Ayesha',
    lastName: 'Malik',
    phone: '+923331122334',
    email: 'ayesha.malik@outlook.com',
    gender: 'FEMALE',
    joinDate: '2026-06-28',
    status: 'ACTIVE',
    streak: {
      id: 'st-2',
      currentStreak: 0,
      longestStreak: 8,
      lastCheckInDate: '2026-09-10',
      streakBrokenAt: '2026-09-11',
    },
    memberships: [
      {
        id: 'ms-2',
        planName: 'Monthly Standard',
        planType: 'MONTHLY',
        price: 500000,
        currency: 'PKR',
        startDate: '2026-08-10',
        endDate: '2026-09-10',
        status: 'EXPIRED',
      },
    ],
    _count: { checkIns: 22 },
  },
  {
    id: 'mem-3',
    gymId: 'gym-1',
    memberCode: 'GR-1003',
    firstName: 'Zaid',
    lastName: 'Siddiqui',
    phone: '+923129988776',
    email: 'zaid.siddiqui@gmail.com',
    gender: 'MALE',
    joinDate: '2026-08-15',
    status: 'ACTIVE',
    streak: {
      id: 'st-3',
      currentStreak: 9,
      longestStreak: 14,
      lastCheckInDate: new Date().toISOString(),
    },
    memberships: [
      {
        id: 'ms-3',
        planName: 'Quarterly VIP',
        planType: 'QUARTERLY',
        price: 1600000,
        currency: 'PKR',
        startDate: '2026-08-15',
        endDate: '2026-11-15',
        status: 'ACTIVE',
      },
    ],
    _count: { checkIns: 34 },
  },
  {
    id: 'mem-4',
    gymId: 'gym-1',
    memberCode: 'GR-1004',
    firstName: 'Fatima',
    lastName: 'Zahra',
    phone: '+923004455667',
    email: 'fatima.zahra@gmail.com',
    gender: 'FEMALE',
    joinDate: '2026-09-01',
    status: 'ACTIVE',
    streak: {
      id: 'st-4',
      currentStreak: 7,
      longestStreak: 7,
      lastCheckInDate: new Date().toISOString(),
    },
    _count: { checkIns: 7 },
  },
];

class ApiClient {
  private token: string | null = null;
  private currentGym = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Iron House Gym & Fitness',
    slug: 'iron-house-lahore',
    city: 'Lahore, Pakistan',
    currency: 'PKR',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('gymretain_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('gymretain_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gymretain_token');
    }
  }

  getCurrentGym() {
    return this.currentGym;
  }

  setGym(gym: { id: string; name: string; slug: string; city: string; currency: string }) {
    this.currentGym = gym;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      // Fallback handled in specific methods
      throw err;
    }
  }

  // Dashboard Summary KPIs
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      return await this.request<DashboardSummary>('/analytics/dashboard');
    } catch {
      return MOCK_SUMMARY;
    }
  }

  // Attendance Trends
  async getAttendanceTrends(days = 30): Promise<AttendanceTrendPoint[]> {
    try {
      return await this.request<AttendanceTrendPoint[]>(`/analytics/attendance-trends?days=${days}`);
    } catch {
      return generateMockTrends(days);
    }
  }

  // Deep Retention Analytics
  async getRetentionAnalytics(): Promise<any> {
    try {
      return await this.request('/analytics/retention-deep');
    } catch {
      return {
        totalActiveMembers: 142,
        retentionRate: 91.4,
        targetBenchmark: 85.0,
        inactivitySpectrum: {
          healthy1to3Days: { count: 84, percentage: 59 },
          warning4to7Days: { count: 28, percentage: 20 },
          highRisk8to14Days: { count: 18, percentage: 13 },
          critical15PlusDays: { count: 12, percentage: 8 },
        },
        streakVelocity: {
          zeroStreak: 32,
          buildingHabit1to5d: 48,
          nearMilestone6to9d: 26,
          approachingVIP10to14d: 18,
          champions15Plusd: 18,
        },
        churnProbabilityModel: [
          { daysInactive: '1-3 Days', probability: 4, label: 'Negligible Churn' },
          { daysInactive: '4-7 Days', probability: 28, label: 'Early Risk Window' },
          { daysInactive: '8-14 Days', probability: 68, label: 'Critical Churn Spike' },
          { daysInactive: '15+ Days', probability: 91, label: 'Silent Churn (Action Required)' },
        ],
      };
    }
  }

  // AI Retention Assistant (Privacy-preserving, sends ONLY missing days, streaks, etc.)
  async askAiAssistant(dto: {
    query?: string;
    anonymizedData?: {
      missingDays: number;
      currentStreak: number;
      longestStreak: number;
      frequencyDrop: number;
      planType?: string;
    };
  }): Promise<any> {
    try {
      return await this.request('/analytics/ai-assistant', {
        method: 'POST',
        body: JSON.stringify(dto),
      });
    } catch {
      const missing = dto.anonymizedData?.missingDays ?? 8;
      const streak = dto.anonymizedData?.currentStreak ?? 0;
      const churnProb = Math.min(98, Math.max(5, Math.round(1 / (1 + Math.exp(-0.25 * (missing - 7))) * 100)));
      return {
        insight: `Analysis for ${missing} absent days: Member has broken habit rhythm after a ${dto.anonymizedData?.longestStreak || 12}-day peak. Churn risk is currently at ${churnProb}%. We recommend delivering a personalized, non-guilt-tripping WhatsApp nudge with a low-friction 20-minute re-entry session.`,
        churnProbability: churnProb,
        privacyPreserved: true,
        signalsSent: dto.anonymizedData,
        recommendedWhatsAppNudge: `Salam! We missed seeing you on the gym floor this week. We know life gets crazy! Come by anytime for a quick 20-min recharge session, and your shake is on us! 🥤💪`,
        modelUsed: 'GymRetain Privacy-Guarded AI Engine',
      };
    }
  }

  // At-Risk Members
  async getAtRiskMembers(level?: 'LOW' | 'MEDIUM' | 'HIGH'): Promise<MemberRiskDetails[]> {
    try {
      const url = level ? `/retention/at-risk-members?level=${level}` : '/retention/at-risk-members';
      return await this.request<MemberRiskDetails[]>(url);
    } catch {
      if (level) {
        return MOCK_SUMMARY.recentAtRiskPreview.filter((m) => m.riskLevel === level);
      }
      return MOCK_SUMMARY.recentAtRiskPreview;
    }
  }

  // Members List
  async getMembers(search?: string, status?: string): Promise<{ members: Member[]; meta: any }> {
    try {
      let query = '';
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (status) query += `&status=${encodeURIComponent(status)}`;
      return await this.request(`/members?${query}`);
    } catch {
      let list = [...MOCK_MEMBERS];
      if (status) {
        list = list.filter((m) => m.status === status);
      }
      if (search) {
        const s = search.toLowerCase();
        list = list.filter(
          (m) =>
            m.firstName.toLowerCase().includes(s) ||
            m.lastName.toLowerCase().includes(s) ||
            m.memberCode.toLowerCase().includes(s) ||
            m.phone.includes(s),
        );
      }
      return { members: list, meta: { total: list.length } };
    }
  }

  // Create Member
  async createMember(data: any): Promise<Member> {
    try {
      return await this.request<Member>('/members', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newMember: Member = {
        id: `mem-${Date.now()}`,
        gymId: this.currentGym.id,
        memberCode: `GR-${1000 + MOCK_MEMBERS.length + 1}`,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        gender: data.gender,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        streak: {
          id: `st-${Date.now()}`,
          currentStreak: 0,
          longestStreak: 0,
        },
      };
      MOCK_MEMBERS.unshift(newMember);
      return newMember;
    }
  }

  // Rewards
  async getRewards(): Promise<Reward[]> {
    try {
      return await this.request<Reward[]>('/rewards');
    } catch {
      return MOCK_REWARDS;
    }
  }

  // Create Reward Rule
  async createReward(data: any): Promise<Reward> {
    try {
      return await this.request<Reward>('/rewards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newReward: Reward = {
        id: `rew-${Date.now()}`,
        gymId: this.currentGym.id,
        title: data.title,
        description: data.description,
        rewardType: data.rewardType,
        triggerType: data.triggerType,
        triggerThreshold: data.triggerThreshold,
        rewardValue: data.rewardValue,
        badgeIcon: 'flame',
        isActive: true,
        _count: { redemptions: 0 },
      };
      MOCK_REWARDS.push(newReward);
      return newReward;
    }
  }

  // Streak Reward Winners
  async getRewardWinners(): Promise<RewardRedemption[]> {
    try {
      const res = await this.request<RewardRedemption[]>('/rewards/winners');
      return res && res.length > 0 ? res : MOCK_WINNERS;
    } catch {
      return MOCK_WINNERS;
    }
  }

  // Redeem Reward
  async redeemReward(redemptionId: string, notes?: string): Promise<RewardRedemption> {
    try {
      return await this.request<RewardRedemption>(`/rewards/redemptions/${redemptionId}/redeem`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
      });
    } catch {
      const item = MOCK_WINNERS.find((w) => w.id === redemptionId);
      if (item) {
        item.status = 'REDEEMED';
        item.redeemedAt = new Date().toISOString();
      }
      return item || ({} as any);
    }
  }

  // Record Check-In
  async recordCheckIn(memberIdentifier: string, method = 'QR_SCAN'): Promise<any> {
    try {
      return await this.request('/check-ins', {
        method: 'POST',
        body: JSON.stringify({ memberIdentifier, method }),
      });
    } catch {
      // Find matching member in mock data
      const member = MOCK_MEMBERS.find(
        (m) =>
          m.memberCode.toLowerCase() === memberIdentifier.toLowerCase() ||
          m.phone.includes(memberIdentifier) ||
          m.id === memberIdentifier,
      );

      if (!member) {
        throw new Error(`Member not found with code or phone "${memberIdentifier}"`);
      }

      const prevStreak = member.streak?.currentStreak || 0;
      const newStreak = prevStreak + 1;
      const newLongest = Math.max(member.streak?.longestStreak || 0, newStreak);

      if (member.streak) {
        member.streak.currentStreak = newStreak;
        member.streak.longestStreak = newLongest;
        member.streak.lastCheckInDate = new Date().toISOString();
      }

      // Check if unlocked 10-day badge
      const unlockedRewards = [];
      if (newStreak === 10) {
        unlockedRewards.push({
          title: '10-Day Streak Warrior',
          badgeIcon: 'flame-gold',
          description: 'Awarded for checking in 10 consecutive days!',
        });
      }

      return {
        checkIn: {
          id: `ci-${Date.now()}`,
          checkInTime: new Date().toISOString(),
          method,
        },
        member: {
          id: member.id,
          code: member.memberCode,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
        },
        streak: {
          current: newStreak,
          longest: newLongest,
          incremented: true,
          streakBroken: false,
        },
        unlockedRewards,
      };
    }
  }

  // QR Code generator
  async getFrontDeskQrCode(): Promise<{ qrPayload: string; qrDataUrl: string }> {
    try {
      return await this.request('/gyms/qr-code');
    } catch {
      return {
        qrPayload: JSON.stringify({
          gymId: this.currentGym.id,
          slug: this.currentGym.slug,
          qrSecret: 'mock-qr-secret-123',
          v: 1,
        }),
        qrDataUrl: '',
      };
    }
  }

  // --- TRAINER ASSIGNMENT API METHODS ---

  async getTrainers(): Promise<any[]> {
    try {
      const res = await this.request<any>('/trainers');
      return res.data || res;
    } catch {
      return [
        {
          id: 'trainer-1',
          name: 'Coach Tariq Mehmood',
          email: 'tariq@ironhouse.pk',
          phone: '+923001234567',
          role: 'TRAINER',
          isActive: true,
          assignedMembersCount: 4,
          createdAt: '2026-08-01T10:00:00Z',
        },
        {
          id: 'trainer-2',
          name: 'Coach Sarah Batool',
          email: 'sarah@ironhouse.pk',
          phone: '+923002345678',
          role: 'TRAINER',
          isActive: true,
          assignedMembersCount: 3,
          createdAt: '2026-08-15T10:00:00Z',
        },
        {
          id: 'trainer-3',
          name: 'Coach Kamran Gill',
          email: 'kamran@ironhouse.pk',
          phone: '+923003456789',
          role: 'TRAINER',
          isActive: true,
          assignedMembersCount: 2,
          createdAt: '2026-09-01T10:00:00Z',
        },
      ];
    }
  }

  async assignTrainer(memberId: string, trainerId: string): Promise<any> {
    try {
      return await this.request('/trainers/assign', {
        method: 'POST',
        body: JSON.stringify({ memberId, trainerId }),
      });
    } catch {
      return { success: true, memberId, trainerId, isActive: true };
    }
  }

  async reassignTrainer(memberId: string, newTrainerId: string): Promise<any> {
    try {
      return await this.request('/trainers/reassign', {
        method: 'POST',
        body: JSON.stringify({ memberId, newTrainerId }),
      });
    } catch {
      return { success: true, memberId, newTrainerId, isActive: true };
    }
  }

  async getTrainerMembers(trainerId?: string): Promise<any[]> {
    try {
      const endpoint = trainerId ? `/trainers/${trainerId}/members` : '/trainers/my-members';
      const res = await this.request<any>(endpoint);
      return res.data || res;
    } catch {
      // Return mock assigned members with streak & diet status
      return [
        {
          assignmentId: 'assign-1',
          assignedAt: '2026-09-10T10:00:00Z',
          member: {
            id: 'mem-1',
            firstName: 'Hamza',
            lastName: 'Sheikh',
            memberCode: 'GR-1001',
            phone: '+923001234567',
            status: 'ACTIVE',
            currentStreak: 12,
            longestStreak: 12,
            totalCheckIns: 28,
          },
          dietPlan: {
            id: 'dp-1',
            title: 'Hypertrophy Power Surplus',
            goal: 'MUSCLE_GAIN',
            customGoal: null,
            mealsCount: 4,
            updatedAt: '2026-09-25T14:30:00Z',
            status: 'ACTIVE_PLAN',
          },
        },
        {
          assignmentId: 'assign-2',
          assignedAt: '2026-09-15T11:00:00Z',
          member: {
            id: 'mem-3',
            firstName: 'Zaid',
            lastName: 'Siddiqui',
            memberCode: 'GR-1003',
            phone: '+923003456789',
            status: 'ACTIVE',
            currentStreak: 9,
            longestStreak: 14,
            totalCheckIns: 22,
          },
          dietPlan: {
            id: 'dp-2',
            title: 'Calorie Deficit Starter',
            goal: 'WEIGHT_LOSS',
            customGoal: null,
            mealsCount: 3,
            updatedAt: '2026-09-16T09:00:00Z',
            status: 'ACTIVE_PLAN',
          },
        },
        {
          assignmentId: 'assign-3',
          assignedAt: '2026-09-20T12:00:00Z',
          member: {
            id: 'mem-4',
            firstName: 'Fatima',
            lastName: 'Zahra',
            memberCode: 'GR-1004',
            phone: '+923214567890',
            status: 'ACTIVE',
            currentStreak: 7,
            longestStreak: 7,
            totalCheckIns: 16,
          },
          dietPlan: {
            id: null,
            title: null,
            goal: null,
            customGoal: null,
            mealsCount: 0,
            updatedAt: null,
            status: 'NO_PLAN',
          },
        },
      ];
    }
  }

  // --- DIET PLAN BUILDER API METHODS ---

  async getDietTemplates(): Promise<any[]> {
    try {
      const res = await this.request<any>('/diet-plans/templates/all');
      return res.data || res;
    } catch {
      return [
        {
          id: 'tpl-1',
          title: 'High-Protein Calorie Deficit (1,800 kcal)',
          goal: 'WEIGHT_LOSS',
          description: 'Optimized for steady fat loss while preserving lean muscle mass.',
          mealsJson: [
            {
              mealType: 'BREAKFAST',
              description: '3 boiled eggs, 1 brown toast, black coffee',
              calories: 320,
              proteinG: 22,
              carbsG: 18,
              fatG: 14,
              orderIndex: 0,
            },
            {
              mealType: 'LUNCH',
              description: '160g grilled chicken breast, 1 cup brown rice, cucumber salad',
              calories: 460,
              proteinG: 45,
              carbsG: 38,
              fatG: 8,
              orderIndex: 1,
            },
            {
              mealType: 'DINNER',
              description: '200g white fish fillet, steamed broccoli & carrots',
              calories: 380,
              proteinG: 42,
              carbsG: 14,
              fatG: 7,
              orderIndex: 2,
            },
            {
              mealType: 'SNACK',
              description: '1 green apple, 10 raw almonds, green tea',
              calories: 160,
              proteinG: 4,
              carbsG: 20,
              fatG: 9,
              orderIndex: 3,
            },
          ],
        },
        {
          id: 'tpl-2',
          title: 'Hypertrophy Muscle Surplus (2,800 kcal)',
          goal: 'MUSCLE_GAIN',
          description: 'High-carb, nutrient-dense protocol for progressive athletic overload.',
          mealsJson: [
            {
              mealType: 'BREAKFAST',
              description: '4 whole eggs, 2 slices oatmeal bread, 1 banana',
              calories: 520,
              proteinG: 32,
              carbsG: 55,
              fatG: 18,
              orderIndex: 0,
            },
            {
              mealType: 'LUNCH',
              description: '200g chicken breast, 1.5 cups basmati rice, lentils (daal)',
              calories: 720,
              proteinG: 58,
              carbsG: 85,
              fatG: 12,
              orderIndex: 1,
            },
            {
              mealType: 'DINNER',
              description: '200g lean beef mince, 2 baked sweet potatoes, mixed greens',
              calories: 680,
              proteinG: 50,
              carbsG: 65,
              fatG: 16,
              orderIndex: 2,
            },
            {
              mealType: 'SNACK',
              description: 'Whey protein shake with 30g peanut butter & rolled oats',
              calories: 440,
              proteinG: 36,
              carbsG: 32,
              fatG: 18,
              orderIndex: 3,
            },
          ],
        },
        {
          id: 'tpl-3',
          title: 'Clean Performance Maintenance (2,200 kcal)',
          goal: 'MAINTENANCE',
          description: 'Balanced macronutrient distribution for consistent gym performance.',
          mealsJson: [
            {
              mealType: 'BREAKFAST',
              description: '2 whole eggs + 2 egg whites, 1 multigrain paratha/roti',
              calories: 400,
              proteinG: 26,
              carbsG: 35,
              fatG: 14,
              orderIndex: 0,
            },
            {
              mealType: 'LUNCH',
              description: '180g chicken curry, 2 whole wheat rotis, fresh cucumber salad',
              calories: 550,
              proteinG: 44,
              carbsG: 50,
              fatG: 15,
              orderIndex: 1,
            },
            {
              mealType: 'DINNER',
              description: '180g grilled fish or chicken, vegetable stir fry with olive oil',
              calories: 450,
              proteinG: 40,
              carbsG: 22,
              fatG: 16,
              orderIndex: 2,
            },
            {
              mealType: 'SNACK',
              description: 'Greek yogurt with fresh berries and chia seeds',
              calories: 220,
              proteinG: 18,
              carbsG: 20,
              fatG: 6,
              orderIndex: 3,
            },
          ],
        },
      ];
    }
  }

  async getMemberDietPlans(memberId: string): Promise<any[]> {
    try {
      const res = await this.request<any>(`/diet-plans/member/${memberId}`);
      return res.data || res;
    } catch {
      return [
        {
          id: 'dp-mock-1',
          gymId: this.currentGym.id,
          memberId,
          createdById: 'trainer-1',
          title: 'Phase 1: Hypertrophy Split Diet',
          goal: 'MUSCLE_GAIN',
          customGoal: null,
          notes: 'Drink minimum 3.5L water daily. Have post-workout meal within 45 mins.',
          isActive: true,
          createdAt: '2026-09-25T14:30:00Z',
          updatedAt: '2026-09-25T14:30:00Z',
          createdBy: { name: 'Coach Tariq Mehmood', role: 'TRAINER' },
          meals: [
            {
              id: 'm-1',
              mealType: 'BREAKFAST',
              description: '4 eggs (3 whites, 1 whole), 2 slices bran bread, 1 banana',
              calories: 410,
              proteinG: 28,
              carbsG: 42,
              fatG: 11,
              orderIndex: 0,
            },
            {
              mealType: 'LUNCH',
              description: '180g grilled chicken breast, 1 cup steamed rice, greens',
              calories: 520,
              proteinG: 48,
              carbsG: 45,
              fatG: 9,
              orderIndex: 1,
            },
            {
              mealType: 'DINNER',
              description: '200g white fish fillet with steamed vegetables',
              calories: 380,
              proteinG: 42,
              carbsG: 15,
              fatG: 8,
              orderIndex: 2,
            },
            {
              mealType: 'SNACK',
              description: '1 scoop whey protein with water + 10 soaked almonds',
              calories: 190,
              proteinG: 26,
              carbsG: 4,
              fatG: 7,
              orderIndex: 3,
            },
          ],
        },
      ];
    }
  }

  async createDietPlan(payload: any): Promise<any> {
    try {
      const res = await this.request<any>('/diet-plans', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data || res;
    } catch {
      return {
        id: `dp-${Date.now()}`,
        ...payload,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async cloneDietTemplate(payload: any): Promise<any> {
    try {
      const res = await this.request<any>('/diet-plans/clone', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data || res;
    } catch {
      return {
        id: `dp-cloned-${Date.now()}`,
        memberId: payload.memberId,
        title: payload.customTitle || 'Cloned Template Plan',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
    }
  }

  // --- AI INSIGHTS CHAT API METHODS ---

  getToken(): string | null {
    if (!this.token && typeof window !== 'undefined') {
      this.token = localStorage.getItem('gymretain_token');
    }
    return this.token;
  }

  async getChatConversations(): Promise<any[]> {
    try {
      const res = await this.request<any>('/chat/conversations');
      return res.data || res;
    } catch {
      return [];
    }
  }

  async getChatMessages(conversationId: string): Promise<any[]> {
    try {
      const res = await this.request<any>(`/chat/conversations/${conversationId}/messages`);
      return res.data || res;
    } catch {
      return [];
    }
  }

  async deleteChatConversation(conversationId: string): Promise<any> {
    try {
      return await this.request(`/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    } catch {
      return { success: true };
    }
  }
}

export const api = new ApiClient();
