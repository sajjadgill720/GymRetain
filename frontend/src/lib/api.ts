import { OperationsState, OperationCommand, demoOperations, applyDemoOperation } from './operations';
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
    membersCheckedInToday: 38,
    visitsToday: 41,
    currentlyCheckedIn: 24,
    capacity: 100,
    capacityPolicy: 'WARNING_ONLY',
    capacityUsagePercent: 24,
    isOverCapacity: false,
    averageVisitDurationMinutes: 62,
    accuracyNotice:
      'Live count reflects open attendance sessions. Missed check-outs or delayed check-outs can affect real-time accuracy.',
    atRiskMembersTotal: 19,
    highRiskCount: 6,
    mediumRiskCount: 13,
    timezone: 'Asia/Karachi',
    todayCheckIns: 38,
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
  dashboardUsesDemoData = false;
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
    this.currentGym = {id:'11111111-1111-1111-1111-111111111111',name:'Iron House Gym & Fitness',slug:'iron-house-lahore',city:'Lahore, Pakistan',currency:'PKR'};
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
        let errorMsg = `HTTP error ${res.status}`;
        try {
          const errJson = await res.json();
          errorMsg = errJson.message || errJson.error || errorMsg;
        } catch {
          // Keep default errorMsg
        }
        throw new Error(errorMsg);
      }

      const json = await res.json();
      return json.data !== undefined ? json.data : json;
    } catch (err) {
      throw err;
    }
  }

  hasSession() { return !!this.token; }

  async authenticate(mode: 'login'|'signup', payload: Record<string,string>): Promise<any> {
    return this.request(mode === 'login' ? '/auth/login' : '/auth/signup-owner', {method:'POST',body:JSON.stringify(payload)});
  }

  async getOperations(): Promise<OperationsState> {
    if (this.token) return this.request('/operations');
    if (typeof window === 'undefined') return demoOperations();
    const key = `gymretain_operations_demo_${this.currentGym.id}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const state = JSON.parse(stored);
      if (!Number.isInteger(state.version) || !['leads','sessions','expenses','tasks'].every(field => Array.isArray(state[field]))) throw new Error('Demo workspace data is damaged. Clear this site’s storage to reset it.');
      return state;
    }
    const state = demoOperations();
    localStorage.setItem(key, JSON.stringify(state));
    return state;
  }

  async mutateOperations(command: OperationCommand): Promise<OperationsState> {
    if (this.token) return this.request('/operations', {method:'POST',body:JSON.stringify(command)});
    const state = applyDemoOperation(await this.getOperations(), command);
    localStorage.setItem(`gymretain_operations_demo_${this.currentGym.id}`, JSON.stringify(state));
    return state;
  }

  // Dashboard Summary KPIs
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const summary = await this.request<DashboardSummary>('/analytics/dashboard');
      this.dashboardUsesDemoData = false;
      return summary;
    } catch (error) {
      if (this.token) throw error;
      this.dashboardUsesDemoData = true;
      return MOCK_SUMMARY;
    }
  }

  // Attendance Trends
  async getAttendanceTrends(days = 30): Promise<AttendanceTrendPoint[]> {
    try {
      return await this.request<AttendanceTrendPoint[]>(`/analytics/attendance-trends?days=${days}`);
    } catch (error) {
      if (this.token) throw error;
      return generateMockTrends(days);
    }
  }

  // Deep Retention Analytics
  async getRetentionAnalytics(): Promise<any> {
    try {
      return await this.request('/analytics/retention-deep');
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
      if (level) {
        return MOCK_SUMMARY.recentAtRiskPreview.filter((m) => m.riskLevel === level);
      }
      return MOCK_SUMMARY.recentAtRiskPreview;
    }
  }

  // Members List
  async getMembers(
    optionsOrSearch?:
      | {
          search?: string;
          status?: string;
          trainerId?: string;
          unassigned?: boolean;
          skip?: number;
          take?: number;
        }
      | string,
    statusArg?: string,
  ): Promise<{ members: Member[]; meta: any }> {
    let search = typeof optionsOrSearch === 'string' ? optionsOrSearch : optionsOrSearch?.search;
    let status = typeof optionsOrSearch === 'string' ? statusArg : optionsOrSearch?.status;
    let trainerId = typeof optionsOrSearch === 'object' ? optionsOrSearch?.trainerId : undefined;
    let unassigned = typeof optionsOrSearch === 'object' ? optionsOrSearch?.unassigned : undefined;
    let skip = typeof optionsOrSearch === 'object' ? optionsOrSearch?.skip : undefined;
    let take = typeof optionsOrSearch === 'object' ? optionsOrSearch?.take : undefined;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (trainerId) params.append('trainerId', trainerId);
    if (unassigned) params.append('unassigned', 'true');
    if (skip !== undefined) params.append('skip', skip.toString());
    if (take !== undefined) params.append('take', take.toString());

    const query = params.toString() ? `?${params.toString()}` : '';
    try {
      const res = await this.request<any>(`/members${query}`);
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      const filtered = MOCK_MEMBERS.filter(member => (!search || `${member.firstName} ${member.lastName} ${member.memberCode} ${member.phone}`.toLowerCase().includes(search.toLowerCase())) && (!status || member.status === status) && (!trainerId || member.trainerAssignments?.some(assignment=>assignment.trainerId===trainerId)) && (!unassigned || !member.trainerAssignments?.length));
      return {members:filtered.slice(skip||0,(skip||0)+(take||100)),meta:{total:filtered.length}};
    }
  }

  // Create Member
  async createMember(data: any): Promise<Member> {
    try {
      return await this.request<Member>('/members', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
      const item = MOCK_WINNERS.find((w) => w.id === redemptionId);
      if (item) {
        item.status = 'REDEEMED';
        item.redeemedAt = new Date().toISOString();
      }
      return item || ({} as any);
    }
  }

  // Capacity Management
  async getCapacityStatus(): Promise<{
    capacity: number;
    capacityPolicy: 'WARNING_ONLY' | 'BLOCK_AT_CAPACITY';
    currentlyCheckedIn: number;
    capacityUsagePercent: number;
    isOverCapacity: boolean;
    remainingCapacity: number;
  }> {
    try {
      const res = await this.request<any>('/gyms/capacity');
      const data = res.data || res;
      const occupancy = data.currentlyCheckedIn ?? data.currentOccupancy ?? 0;
      return {
        ...data,
        currentlyCheckedIn: occupancy,
        capacityPolicy: data.capacityPolicy === 'BLOCK_ADMISSION' ? 'BLOCK_AT_CAPACITY' : data.capacityPolicy,
        capacityUsagePercent: data.capacityUsagePercent ?? data.utilizationPercent ?? 0,
        remainingCapacity: Math.max(0, data.capacity - occupancy),
      };
    } catch (error) {
      if (this.token) throw error;
      return {
        capacity: 100,
        capacityPolicy: 'WARNING_ONLY',
        currentlyCheckedIn: 38,
        capacityUsagePercent: 38,
        isOverCapacity: false,
        remainingCapacity: 62,
      };
    }
  }

  async updateCapacity(dto: {
    capacity: number;
    capacityPolicy?: 'WARNING_ONLY' | 'BLOCK_AT_CAPACITY';
  }): Promise<any> {
    const res = await this.request<any>('/gyms/my-gym', {
      method: 'PATCH',
      body: JSON.stringify({ ...dto, capacityPolicy: dto.capacityPolicy === 'BLOCK_AT_CAPACITY' ? 'BLOCK_ADMISSION' : dto.capacityPolicy }),
    });
    return res.data || res;
  }

  // Attendance Sessions: Lookup Member Before Check-In/Check-Out
  async lookupMemberForCheckIn(identifier: string): Promise<any> {
    try {
      const res = await this.request<any>(
        `/members/lookup-for-checkin?identifier=${encodeURIComponent(identifier)}`,
      );
      return res.data || res;
    } catch (err: any) {
      // Mock lookup fallback if server offline
      const member = MOCK_MEMBERS.find(
        (m) =>
          m.memberCode.toLowerCase() === identifier.toLowerCase() ||
          m.phone.includes(identifier) ||
          m.id === identifier,
      );
      if (!member) {
        throw new Error(err.message || `Member not found with "${identifier}"`);
      }
      return {
        id: member.id,
        memberCode: member.memberCode,
        fullName: `${member.firstName} ${member.lastName}`,
        phone: member.phone,
        status: member.status,
        hasActivePass: true,
        currentSession: null,
      };
    }
  }

  // Attendance Sessions: Record Check-In
  async recordCheckIn(
    memberIdentifier: string,
    method = 'QR_SCAN',
    idempotencyKey?: string,
  ): Promise<any> {
    const res = await this.request<any>('/check-ins', {
      method: 'POST',
      body: JSON.stringify({ memberIdentifier, method, idempotencyKey }),
    });
    return res.data || res;
  }

  // Attendance Sessions: Explicit Check-Out
  async recordCheckOut(memberIdentifier: string, method = 'QR_SCAN'): Promise<any> {
    const res = await this.request<any>('/check-ins/check-out', {
      method: 'POST',
      body: JSON.stringify({ memberIdentifier, method }),
    });
    return res.data || res;
  }

  // Attendance Sessions: Open Sessions on Floor
  async getOpenAttendanceSessions(): Promise<any[]> {
    try {
      const res = await this.request<any>('/check-ins/open-sessions');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  // Attendance Sessions: Correct Missed Check-Out
  async correctMissedCheckOut(
    checkInId: string,
    checkOutTime: string,
    note?: string,
  ): Promise<any> {
    const res = await this.request<any>(`/check-ins/${checkInId}/correct`, {
      method: 'PATCH',
      body: JSON.stringify({ checkOutTime, note }),
    });
    return res.data || res;
  }

  // QR Code generator for Front Desk
  async getFrontDeskQrCode(): Promise<{ qrPayload: string; qrDataUrl: string }> {
    try {
      const res = await this.request<any>('/gyms/qr-code');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
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

  async rotateFrontDeskQrCode(): Promise<any> {
    const res = await this.request<any>('/gyms/qr-code/rotate', {
      method: 'POST',
    });
    return res.data || res;
  }

  // Member Individual QR Credentials
  async getMemberQrCode(memberId: string): Promise<any> {
    const res = await this.request<any>(`/members/${memberId}/qr-code`);
    return res.data || res;
  }

  async rotateMemberQrCredential(memberId: string): Promise<any> {
    const res = await this.request<any>(`/members/${memberId}/qr-code/rotate`, {
      method: 'POST',
    });
    return res.data || res;
  }

  async revokeMemberQrCredential(memberId: string): Promise<any> {
    const res = await this.request<any>(`/members/${memberId}/qr-code/revoke`, {
      method: 'POST',
    });
    return res.data || res;
  }

  // Retention Interventions & Notes
  async recordRetentionIntervention(payload: {
    memberId: string;
    outreachMethod: string;
    notes?: string;
    outcome?: string;
    followUpDate?: string;
  }): Promise<any> {
    const res = await this.request<any>('/retention/intervention', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data || res;
  }

  async getMemberInterventions(memberId: string): Promise<any[]> {
    try {
      const res = await this.request<any>(`/retention/members/${memberId}/interventions`);
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  // SaaS Multi-Tenant Billing & Entitlements
  async getSaasBillingStatus(): Promise<any> {
    try {
      const res = await this.request<any>('/saas-billing/status');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return {
        gymId: this.currentGym.id,
        plan: 'STARTER',
        status: 'TRIAL',
        currentPeriodEnd: new Date(Date.now() + 14 * 86400000).toISOString(),
        isTrialActive: true,
        entitlements: {
          maxMembers: 150,
          maxStaff: 3,
          currentMemberCount: 142,
          currentStaffCount: 2,
          hasAiAssistant: false,
          hasMultiLocation: false,
        },
      };
    }
  }

  async createSaasCheckout(dto: {
    plan: 'STARTER' | 'PRO' | 'ENTERPRISE';
    billingInterval?: 'MONTHLY' | 'ANNUAL';
    returnUrl?: string;
  }): Promise<any> {
    const res = await this.request<any>('/saas-billing/checkout', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.data || res;
  }

  async simulateSaasPayment(dto: {
    eventType: 'payment_succeeded' | 'payment_failed';
    plan?: 'STARTER' | 'PRO' | 'ENTERPRISE';
  }): Promise<any> {
    const res = await this.request<any>('/saas-billing/simulate-webhook', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.data || res;
  }

  async cancelSaasSubscription(): Promise<any> {
    const res = await this.request<any>('/saas-billing/cancel', {
      method: 'POST',
    });
    return res.data || res;
  }

  async getSaasInvoices(): Promise<any[]> {
    try {
      const res = await this.request<any>('/saas-billing/invoices');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  // Staff Team & Role Management
  async getStaffTeam(): Promise<any[]> {
    try {
      const res = await this.request<any>('/auth/team/staff');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  async getStaffInvitations(): Promise<any[]> {
    try {
      const res = await this.request<any>('/auth/team/invitations');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  async inviteStaffMember(dto: { email: string; role: 'STAFF' | 'TRAINER' }): Promise<any> {
    const res = await this.request<any>('/auth/team/invite', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
    return res.data || res;
  }

  async revokeStaffInvitation(id: string): Promise<any> {
    const res = await this.request<any>(`/auth/team/invitations/${id}`, {
      method: 'DELETE',
    });
    return res.data || res;
  }

  async updateStaffRole(id: string, role: 'STAFF' | 'TRAINER'): Promise<any> {
    const res = await this.request<any>(`/auth/team/staff/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.data || res;
  }

  // --- TRAINER MANAGEMENT & ASSIGNMENT API METHODS ---

  async getTrainers(options?: {
    search?: string;
    status?: 'active' | 'inactive' | 'all';
    includeArchived?: boolean;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (options?.search) params.append('search', options.search);
    if (options?.status) params.append('status', options.status);
    if (options?.includeArchived) params.append('includeArchived', 'true');

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await this.request<any>(`/trainers${query}`);
    return res.data || res;
  }

  async getTrainer(id: string): Promise<any> {
    const res = await this.request<any>(`/trainers/${id}`);
    return res.data || res;
  }

  async createTrainer(data: {
    name: string;
    email?: string;
    phone?: string;
    specialties?: string[];
    photoUrl?: string;
    bio?: string;
    isActive?: boolean;
  }): Promise<any> {
    const res = await this.request<any>('/trainers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data || res;
  }

  async updateTrainer(
    id: string,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      specialties?: string[];
      photoUrl?: string;
      bio?: string;
      isActive?: boolean;
    },
  ): Promise<any> {
    const res = await this.request<any>(`/trainers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data || res;
  }

  async removeTrainer(
    id: string,
    options?: { reassignTrainerId?: string; unassignMembers?: boolean },
  ): Promise<any> {
    const res = await this.request<any>(`/trainers/${id}`, {
      method: 'DELETE',
      body: JSON.stringify(options || {}),
    });
    return res.data || res;
  }

  async assignTrainer(memberId: string, trainerId: string): Promise<any> {
    const res = await this.request<any>('/trainers/assign', {
      method: 'POST',
      body: JSON.stringify({ memberId, trainerId }),
    });
    return res.data || res;
  }

  async bulkAssignTrainer(trainerId: string, memberIds: string[]): Promise<any> {
    const res = await this.request<any>('/trainers/bulk-assign', {
      method: 'POST',
      body: JSON.stringify({ trainerId, memberIds }),
    });
    return res.data || res;
  }

  async reassignTrainer(memberId: string, newTrainerId: string): Promise<any> {
    const res = await this.request<any>('/trainers/reassign', {
      method: 'POST',
      body: JSON.stringify({ memberId, newTrainerId }),
    });
    return res.data || res;
  }

  async unassignMember(memberId: string): Promise<any> {
    const res = await this.request<any>('/trainers/unassign', {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
    return res.data || res;
  }

  async getTrainerMembers(trainerId?: string): Promise<any[]> {
    const endpoint = trainerId ? `/trainers/${trainerId}/members` : '/trainers/my-members';
    const res = await this.request<any>(endpoint);
    return res.data || res;
  }

  async getUnassignedMembers(): Promise<any[]> {
    const res = await this.request<any>('/trainers/unassigned-members');
    return res.data || res;
  }

  async getMemberAssignments(memberId: string): Promise<any[]> {
    const res = await this.request<any>(`/trainers/members/${memberId}/history`);
    return res.data || res;
  }

  // --- DIET PLAN BUILDER API METHODS ---

  async getDietTemplates(): Promise<any[]> {
    try {
      const res = await this.request<any>('/diet-plans/templates/all');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
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
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  async getChatMessages(conversationId: string): Promise<any[]> {
    try {
      const res = await this.request<any>(`/chat/conversations/${conversationId}/messages`);
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [];
    }
  }

  async deleteChatConversation(conversationId: string): Promise<any> {
    try {
      return await this.request(`/chat/conversations/${conversationId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      if (this.token) throw error;
      return { success: true };
    }
  }

  async simulateWhatsAppMessage(payload: { memberId: string; messageType: string }): Promise<any> {
    try {
      return await this.request('/messaging/whatsapp/simulate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      if (this.token) throw error;
      return { success: true, simulated: true, payload };
    }
  }

  async previewWhatsAppReply(payload: { phone: string; message: string; gymId?: string }): Promise<{ reply?: string; message?: string }> {
    return this.request('/messaging/whatsapp/simulate', { method: 'POST', body: JSON.stringify(payload) });
  }

  // --- SUBSCRIPTION & PAYMENT MANAGEMENT ---

  async getSubscriptions(status?: string): Promise<any[]> {
    try {
      const query = status && status !== 'ALL' ? `?status=${status}` : '';
      const res = await this.request<any>(`/payments/subscriptions${query}`);
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [
        {
          id: 'sub-1',
          memberId: 'mem-1',
          planName: 'Pro Strength & Cardio',
          planType: 'MONTHLY',
          price: 6500,
          currency: 'PKR',
          startDate: '2026-09-15',
          endDate: '2026-10-15',
          status: 'ACTIVE',
          autoRenew: true,
          member: { id: 'mem-1', memberCode: 'GR-1001', firstName: 'Hamza', lastName: 'Sheikh', phone: '+923001234567' },
          latestPayment: { id: 'pay-101', amount: 6500, provider: 'CASH', paidAt: '2026-09-15T10:30:00Z' },
        },
        {
          id: 'sub-2',
          memberId: 'mem-2',
          planName: 'Standard Fitness Pass',
          planType: 'MONTHLY',
          price: 4500,
          currency: 'PKR',
          startDate: '2026-09-01',
          endDate: '2026-10-01',
          status: 'EXPIRED',
          autoRenew: false,
          member: { id: 'mem-2', memberCode: 'GR-1002', firstName: 'Ayesha', lastName: 'Malik', phone: '+923331122334' },
          latestPayment: { id: 'pay-102', amount: 4500, provider: 'BANK_TRANSFER', paidAt: '2026-09-01T12:00:00Z' },
        },
        {
          id: 'sub-3',
          memberId: 'mem-3',
          planName: 'Quarterly Body Transformation',
          planType: 'QUARTERLY',
          price: 16500,
          currency: 'PKR',
          startDate: '2026-08-01',
          endDate: '2026-11-01',
          status: 'ACTIVE',
          autoRenew: true,
          member: { id: 'mem-3', memberCode: 'GR-1003', firstName: 'Zaid', lastName: 'Siddiqui', phone: '+923214567890' },
          latestPayment: { id: 'pay-103', amount: 16500, provider: 'JAZZCASH', paidAt: '2026-08-01T09:15:00Z' },
        },
        {
          id: 'sub-4',
          memberId: 'mem-4',
          planName: 'Standard Monthly Pass',
          planType: 'MONTHLY',
          price: 5000,
          currency: 'PKR',
          startDate: '2026-09-20',
          endDate: '2026-10-20',
          status: 'ACTIVE',
          autoRenew: true,
          member: { id: 'mem-4', memberCode: 'GR-1004', firstName: 'Fatima', lastName: 'Zahra', phone: '+923214455667' },
          latestPayment: { id: 'pay-104', amount: 5000, provider: 'CASH', paidAt: '2026-09-20T14:45:00Z' },
        },
        {
          id: 'sub-5',
          memberId: 'mem-5',
          planName: 'Annual VIP All-Access',
          planType: 'ANNUAL',
          price: 48000,
          currency: 'PKR',
          startDate: '2026-01-10',
          endDate: '2027-01-10',
          status: 'ACTIVE',
          autoRenew: true,
          member: { id: 'mem-5', memberCode: 'GR-1005', firstName: 'Bilal', lastName: 'Ahmed', phone: '+923009988776' },
          latestPayment: { id: 'pay-105', amount: 48000, provider: 'BANK_TRANSFER', paidAt: '2026-01-10T11:00:00Z' },
        },
        {
          id: 'sub-6',
          memberId: 'mem-7',
          planName: 'Standard Monthly Pass',
          planType: 'MONTHLY',
          price: 5000,
          currency: 'PKR',
          startDate: '2026-09-05',
          endDate: '2026-10-05',
          status: 'PENDING_PAYMENT',
          autoRenew: false,
          member: { id: 'mem-7', memberCode: 'GR-1007', firstName: 'Omer', lastName: 'Farooq', phone: '+923005544332' },
          latestPayment: null,
        },
      ];
    }
  }

  async createSubscription(payload: any): Promise<any> {
    try {
      const res = await this.request<any>('/payments/subscriptions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return { id: `sub-${Date.now()}`, ...payload, status: 'ACTIVE' };
    }
  }

  async renewSubscription(id: string, payload: any): Promise<any> {
    try {
      const res = await this.request<any>(`/payments/subscriptions/${id}/renew`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return { id, success: true };
    }
  }

  async cancelSubscription(id: string): Promise<any> {
    try {
      return await this.request(`/payments/subscriptions/${id}/cancel`, {
        method: 'PATCH',
      });
    } catch (error) {
      if (this.token) throw error;
      return { id, status: 'CANCELLED' };
    }
  }

  async getPaymentRecords(): Promise<any[]> {
    try {
      const res = await this.request<any>('/payments/records');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return [
        {
          id: 'pay-201',
          memberId: 'mem-1',
          amount: 6500,
          currency: 'PKR',
          provider: 'CASH',
          status: 'COMPLETED',
          providerReference: 'RCPT-2026-0915',
          paidAt: '2026-09-15T10:30:00Z',
          createdAt: '2026-09-15T10:30:00Z',
          member: { id: 'mem-1', memberCode: 'GR-1001', firstName: 'Hamza', lastName: 'Sheikh', phone: '+923001234567' },
          membership: { planName: 'Pro Strength & Cardio', planType: 'MONTHLY' },
        },
        {
          id: 'pay-202',
          memberId: 'mem-4',
          amount: 5000,
          currency: 'PKR',
          provider: 'CASH',
          status: 'COMPLETED',
          providerReference: 'RCPT-2026-0920',
          paidAt: '2026-09-20T14:45:00Z',
          createdAt: '2026-09-20T14:45:00Z',
          member: { id: 'mem-4', memberCode: 'GR-1004', firstName: 'Fatima', lastName: 'Zahra', phone: '+923214455667' },
          membership: { planName: 'Standard Monthly Pass', planType: 'MONTHLY' },
        },
        {
          id: 'pay-203',
          memberId: 'mem-3',
          amount: 16500,
          currency: 'PKR',
          provider: 'JAZZCASH',
          status: 'COMPLETED',
          providerReference: 'JC-8849124',
          paidAt: '2026-08-01T09:15:00Z',
          createdAt: '2026-08-01T09:15:00Z',
          member: { id: 'mem-3', memberCode: 'GR-1003', firstName: 'Zaid', lastName: 'Siddiqui', phone: '+923214567890' },
          membership: { planName: 'Quarterly Body Transformation', planType: 'QUARTERLY' },
        },
        {
          id: 'pay-204',
          memberId: 'mem-5',
          amount: 48000,
          currency: 'PKR',
          provider: 'BANK_TRANSFER',
          status: 'COMPLETED',
          providerReference: 'HBL-PK-77491',
          paidAt: '2026-01-10T11:00:00Z',
          createdAt: '2026-01-10T11:00:00Z',
          member: { id: 'mem-5', memberCode: 'GR-1005', firstName: 'Bilal', lastName: 'Ahmed', phone: '+923009988776' },
          membership: { planName: 'Annual VIP All-Access', planType: 'ANNUAL' },
        },
      ];
    }
  }

  async recordPayment(payload: any): Promise<any> {
    try {
      const res = await this.request<any>('/payments/record', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return { id: `pay-${Date.now()}`, ...payload, status: 'COMPLETED', createdAt: new Date().toISOString() };
    }
  }

  async getSubscriptionMetrics(): Promise<any> {
    try {
      const res = await this.request<any>('/payments/metrics');
      return res.data || res;
    } catch (error) {
      if (this.token) throw error;
      return {
        activeSubscriptions: 138,
        pendingPayments: 6,
        expiredSubscriptions: 4,
        expiringWithin7Days: 8,
        totalRevenueRecorded: 485000,
        currency: 'PKR',
        totalSubscriptionsTracked: 148,
      };
    }
  }
}

export const api = new ApiClient();
