import {
  DashboardSummary,
  AttendanceTrendPoint,
  MemberRiskDetails,
  Member,
  Reward,
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
}

export const api = new ApiClient();
