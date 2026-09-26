export type Role = 'SUPER_ADMIN' | 'GYM_OWNER' | 'GYM_STAFF';

export interface Gym {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email?: string;
  address?: string;
  qrCodeSecret: string;
  currency: string;
  timezone: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  gymId: string | null;
  gymName?: string | null;
  gymSlug?: string | null;
}

export interface Member {
  id: string;
  gymId: string;
  memberCode: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'FROZEN';
  streak?: Streak;
  memberships?: Membership[];
  _count?: {
    checkIns: number;
  };
}

export interface Membership {
  id: string;
  planName: string;
  planType: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'SESSION_PASS';
  price: number; // in paisa
  currency: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PENDING_PAYMENT';
}

export interface Streak {
  id: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate?: string;
  streakBrokenAt?: string;
}

export interface CheckIn {
  id: string;
  memberId: string;
  checkInTime: string;
  checkInDate: string;
  method: 'QR_SCAN' | 'MANUAL_STAFF' | 'KIOSK';
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    memberCode: string;
    phone: string;
  };
}

export interface Reward {
  id: string;
  gymId: string;
  title: string;
  description?: string;
  rewardType: 'BADGE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FREE_DAYS' | 'FREE_ITEM';
  triggerType: 'STREAK_MILESTONE' | 'TOTAL_CHECKINS' | 'MANUAL';
  triggerThreshold: number;
  rewardValue?: number;
  badgeIcon?: string;
  isActive: boolean;
  _count?: {
    redemptions: number;
  };
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  memberId: string;
  status: 'UNLOCKED' | 'REDEEMED' | 'EXPIRED';
  unlockedAt: string;
  redeemedAt?: string;
  reward: Reward;
  member?: Member;
}

export interface MemberRiskDetails {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone: string;
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  factors: {
    daysSinceLastCheckIn: number;
    daysInactiveScore: number;
    weeklyVisitsCurrent: number;
    fourWeekRollingAvg: number;
    frequencyDropPercentage: number;
    frequencyDropScore: number;
    isPaymentOverdue: boolean;
    paymentOverdueScore: number;
    isRecentlyBrokenStreak: boolean;
    brokenStreakScore: number;
  };
}

export interface DashboardSummary {
  kpis: {
    activeMembers: number;
    todayCheckIns: number;
    atRiskMembersTotal: number;
    highRiskCount: number;
    mediumRiskCount: number;
  };
  streakLeaders: Array<{
    memberId: string;
    memberName: string;
    memberCode: string;
    currentStreak: number;
    longestStreak: number;
  }>;
  recentAtRiskPreview: MemberRiskDetails[];
}

export interface AttendanceTrendPoint {
  date: string;
  checkIns: number;
}
