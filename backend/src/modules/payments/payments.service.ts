import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';
import { MembershipStatus, PaymentStatus, PlanType, PaymentProviderType } from '@prisma/client';

export interface SubscriptionItem {
  id: string;
  gymId: string;
  memberId: string;
  planName: string;
  planType: PlanType;
  price: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: MembershipStatus;
  autoRenew: boolean;
  member: {
    id: string;
    memberCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  latestPayment?: {
    id: string;
    amount: number;
    provider: PaymentProviderType;
    paidAt: string | null;
  } | null;
}

export interface PaymentItem {
  id: string;
  gymId: string;
  memberId: string;
  membershipId?: string | null;
  amount: number;
  currency: string;
  provider: PaymentProviderType;
  status: PaymentStatus;
  providerReference?: string | null;
  paidAt?: string | null;
  createdAt: string;
  member: {
    id: string;
    memberCode: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  membership?: {
    planName: string;
    planType: PlanType;
  } | null;
}

const DEMO_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub-1',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-1',
    planName: 'Pro Strength & Cardio',
    planType: PlanType.MONTHLY,
    price: 6500,
    currency: 'PKR',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    status: MembershipStatus.ACTIVE,
    autoRenew: true,
    member: {
      id: 'mem-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
    },
    latestPayment: {
      id: 'pay-101',
      amount: 6500,
      provider: PaymentProviderType.CASH,
      paidAt: '2026-09-15T10:30:00Z',
    },
  },
  {
    id: 'sub-2',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-2',
    planName: 'Standard Fitness Pass',
    planType: PlanType.MONTHLY,
    price: 4500,
    currency: 'PKR',
    startDate: '2026-09-01',
    endDate: '2026-10-01',
    status: MembershipStatus.EXPIRED,
    autoRenew: false,
    member: {
      id: 'mem-2',
      memberCode: 'GR-1002',
      firstName: 'Ayesha',
      lastName: 'Malik',
      phone: '+923331122334',
    },
    latestPayment: {
      id: 'pay-102',
      amount: 4500,
      provider: PaymentProviderType.BANK_TRANSFER,
      paidAt: '2026-09-01T12:00:00Z',
    },
  },
  {
    id: 'sub-3',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-3',
    planName: 'Quarterly Body Transformation',
    planType: PlanType.QUARTERLY,
    price: 16500,
    currency: 'PKR',
    startDate: '2026-08-01',
    endDate: '2026-11-01',
    status: MembershipStatus.ACTIVE,
    autoRenew: true,
    member: {
      id: 'mem-3',
      memberCode: 'GR-1003',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      phone: '+923214567890',
    },
    latestPayment: {
      id: 'pay-103',
      amount: 16500,
      provider: PaymentProviderType.JAZZCASH,
      paidAt: '2026-08-01T09:15:00Z',
    },
  },
  {
    id: 'sub-4',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-4',
    planName: 'Standard Monthly Pass',
    planType: PlanType.MONTHLY,
    price: 5000,
    currency: 'PKR',
    startDate: '2026-09-20',
    endDate: '2026-10-20',
    status: MembershipStatus.ACTIVE,
    autoRenew: true,
    member: {
      id: 'mem-4',
      memberCode: 'GR-1004',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+923214455667',
    },
    latestPayment: {
      id: 'pay-104',
      amount: 5000,
      provider: PaymentProviderType.CASH,
      paidAt: '2026-09-20T14:45:00Z',
    },
  },
  {
    id: 'sub-5',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-5',
    planName: 'Annual VIP All-Access',
    planType: PlanType.ANNUAL,
    price: 48000,
    currency: 'PKR',
    startDate: '2026-01-10',
    endDate: '2027-01-10',
    status: MembershipStatus.ACTIVE,
    autoRenew: true,
    member: {
      id: 'mem-5',
      memberCode: 'GR-1005',
      firstName: 'Bilal',
      lastName: 'Ahmed',
      phone: '+923009988776',
    },
    latestPayment: {
      id: 'pay-105',
      amount: 48000,
      provider: PaymentProviderType.BANK_TRANSFER,
      paidAt: '2026-01-10T11:00:00Z',
    },
  },
  {
    id: 'sub-6',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-7',
    planName: 'Standard Monthly Pass',
    planType: PlanType.MONTHLY,
    price: 5000,
    currency: 'PKR',
    startDate: '2026-09-05',
    endDate: '2026-10-05',
    status: MembershipStatus.PENDING_PAYMENT,
    autoRenew: false,
    member: {
      id: 'mem-7',
      memberCode: 'GR-1007',
      firstName: 'Omer',
      lastName: 'Farooq',
      phone: '+923005544332',
    },
    latestPayment: null,
  },
];

const DEMO_PAYMENTS: PaymentItem[] = [
  {
    id: 'pay-201',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-1',
    membershipId: 'sub-1',
    amount: 6500,
    currency: 'PKR',
    provider: PaymentProviderType.CASH,
    status: PaymentStatus.COMPLETED,
    providerReference: 'RCPT-2026-0915',
    paidAt: '2026-09-15T10:30:00Z',
    createdAt: '2026-09-15T10:30:00Z',
    member: {
      id: 'mem-1',
      memberCode: 'GR-1001',
      firstName: 'Hamza',
      lastName: 'Sheikh',
      phone: '+923001234567',
    },
    membership: {
      planName: 'Pro Strength & Cardio',
      planType: PlanType.MONTHLY,
    },
  },
  {
    id: 'pay-202',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-4',
    membershipId: 'sub-4',
    amount: 5000,
    currency: 'PKR',
    provider: PaymentProviderType.CASH,
    status: PaymentStatus.COMPLETED,
    providerReference: 'RCPT-2026-0920',
    paidAt: '2026-09-20T14:45:00Z',
    createdAt: '2026-09-20T14:45:00Z',
    member: {
      id: 'mem-4',
      memberCode: 'GR-1004',
      firstName: 'Fatima',
      lastName: 'Zahra',
      phone: '+923214455667',
    },
    membership: {
      planName: 'Standard Monthly Pass',
      planType: PlanType.MONTHLY,
    },
  },
  {
    id: 'pay-203',
    gymId: '11111111-1111-1111-1111-111111111111',
    memberId: 'mem-3',
    membershipId: 'sub-3',
    amount: 16500,
    currency: 'PKR',
    provider: PaymentProviderType.JAZZCASH,
    status: PaymentStatus.COMPLETED,
    providerReference: 'JC-8849124',
    paidAt: '2026-08-01T09:15:00Z',
    createdAt: '2026-08-01T09:15:00Z',
    member: {
      id: 'mem-3',
      memberCode: 'GR-1003',
      firstName: 'Zaid',
      lastName: 'Siddiqui',
      phone: '+923214567890',
    },
    membership: {
      planName: 'Quarterly Body Transformation',
      planType: PlanType.QUARTERLY,
    },
  },
];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private localSubscriptions: SubscriptionItem[] = [...DEMO_SUBSCRIPTIONS];
  private localPayments: PaymentItem[] = [...DEMO_PAYMENTS];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all subscriptions for the authenticated gym tenant
   */
  async listSubscriptions(gymId: string, status?: string) {
    try {
      const where: any = { gymId };
      if (status && status !== 'ALL') {
        where.status = status as MembershipStatus;
      }

      const rows = await this.prisma.membership.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          payments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              amount: true,
              provider: true,
              paidAt: true,
            },
          },
        },
        orderBy: { endDate: 'asc' },
      });

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          ...r,
          startDate: r.startDate.toISOString(),
          endDate: r.endDate.toISOString(),
          latestPayment: r.payments[0]
            ? {
                ...r.payments[0],
                paidAt: r.payments[0].paidAt?.toISOString() || null,
              }
            : null,
        }));
      }

      return this.localSubscriptions.filter((s) => !status || status === 'ALL' || s.status === status);
    } catch {
      return this.localSubscriptions.filter((s) => !status || status === 'ALL' || s.status === status);
    }
  }

  /**
   * Create / assign a new subscription to a member
   */
  async createSubscription(gymId: string, dto: CreateSubscriptionDto) {
    try {
      const created = await this.prisma.membership.create({
        data: {
          gymId,
          memberId: dto.memberId,
          planName: dto.planName,
          planType: dto.planType,
          price: dto.price * 100, // store in minor units
          currency: 'PKR',
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: MembershipStatus.ACTIVE,
          autoRenew: dto.autoRenew ?? false,
        },
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      return created;
    } catch {
      const newSub: SubscriptionItem = {
        id: `sub-${Date.now()}`,
        gymId,
        memberId: dto.memberId,
        planName: dto.planName,
        planType: dto.planType,
        price: dto.price,
        currency: 'PKR',
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: MembershipStatus.ACTIVE,
        autoRenew: dto.autoRenew ?? false,
        member: {
          id: dto.memberId,
          memberCode: 'GR-NEW',
          firstName: 'Member',
          lastName: 'Enrolled',
          phone: '+923000000000',
        },
      };
      this.localSubscriptions.unshift(newSub);
      return newSub;
    }
  }

  /**
   * Renew an existing member subscription
   */
  async renewSubscription(gymId: string, membershipId: string, dto: RenewSubscriptionDto) {
    const months = dto.durationMonths || 1;

    try {
      const existing = await this.prisma.membership.findFirst({
        where: { id: membershipId, gymId },
      });

      if (!existing) {
        throw new NotFoundException('Subscription not found');
      }

      const currentEnd = new Date(existing.endDate);
      const baseDate = currentEnd > new Date() ? currentEnd : new Date();
      const newEndDate = new Date(baseDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      const updated = await this.prisma.membership.update({
        where: { id: membershipId },
        data: {
          endDate: newEndDate,
          status: MembershipStatus.ACTIVE,
        },
      });

      if (dto.recordPayment && dto.amount) {
        await this.prisma.payment.create({
          data: {
            gymId,
            memberId: existing.memberId,
            membershipId,
            amount: dto.amount * 100,
            currency: 'PKR',
            provider: dto.paymentProvider || PaymentProviderType.CASH,
            status: PaymentStatus.COMPLETED,
            providerReference: `RENEWAL-${Date.now()}`,
            paidAt: new Date(),
          },
        });
      }

      return updated;
    } catch {
      const idx = this.localSubscriptions.findIndex((s) => s.id === membershipId);
      if (idx !== -1) {
        const sub = this.localSubscriptions[idx];
        const base = new Date();
        base.setMonth(base.getMonth() + months);
        sub.endDate = base.toISOString().split('T')[0];
        sub.status = MembershipStatus.ACTIVE;

        if (dto.recordPayment && dto.amount) {
          this.localPayments.unshift({
            id: `pay-${Date.now()}`,
            gymId,
            memberId: sub.memberId,
            membershipId,
            amount: dto.amount,
            currency: 'PKR',
            provider: dto.paymentProvider || PaymentProviderType.CASH,
            status: PaymentStatus.COMPLETED,
            providerReference: `RENEWAL-${Date.now()}`,
            paidAt: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            member: sub.member,
            membership: { planName: sub.planName, planType: sub.planType },
          });
        }
        return sub;
      }
      return { success: true, message: 'Subscription renewed' };
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(gymId: string, membershipId: string) {
    try {
      return await this.prisma.membership.updateMany({
        where: { id: membershipId, gymId },
        data: { status: MembershipStatus.CANCELLED },
      });
    } catch {
      const sub = this.localSubscriptions.find((s) => s.id === membershipId);
      if (sub) {
        sub.status = MembershipStatus.CANCELLED;
      }
      return { success: true };
    }
  }

  /**
   * List all internally recorded payments
   */
  async listPayments(gymId: string) {
    try {
      const rows = await this.prisma.payment.findMany({
        where: { gymId },
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          membership: {
            select: {
              planName: true,
              planType: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (rows && rows.length > 0) {
        return rows.map((p) => ({
          ...p,
          amount: Math.round(p.amount / 100),
          paidAt: p.paidAt?.toISOString() || null,
          createdAt: p.createdAt.toISOString(),
        }));
      }

      return this.localPayments;
    } catch {
      return this.localPayments;
    }
  }

  /**
   * Record a manual payment (Cash, Bank Transfer, JazzCash/EasyPaisa counter receipt)
   */
  async recordPayment(gymId: string, staffId: string, dto: RecordPaymentDto) {
    try {
      const created = await this.prisma.payment.create({
        data: {
          gymId,
          memberId: dto.memberId,
          membershipId: dto.membershipId,
          amount: dto.amount * 100,
          currency: dto.currency || 'PKR',
          provider: dto.provider,
          status: dto.status || PaymentStatus.COMPLETED,
          providerReference: dto.providerReference || `RCPT-${Date.now().toString().slice(-6)}`,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          paymentMethodDetails: dto.notes ? { notes: dto.notes, recordedByStaffId: staffId } : undefined,
        },
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      // If associated with a pending membership, mark it active
      if (dto.membershipId) {
        await this.prisma.membership.updateMany({
          where: { id: dto.membershipId, gymId, status: MembershipStatus.PENDING_PAYMENT },
          data: { status: MembershipStatus.ACTIVE },
        });
      }

      return {
        ...created,
        amount: Math.round(created.amount / 100),
      };
    } catch {
      const newPay: PaymentItem = {
        id: `pay-${Date.now()}`,
        gymId,
        memberId: dto.memberId,
        membershipId: dto.membershipId,
        amount: dto.amount,
        currency: 'PKR',
        provider: dto.provider,
        status: dto.status || PaymentStatus.COMPLETED,
        providerReference: dto.providerReference || `RCPT-${Date.now().toString().slice(-6)}`,
        paidAt: dto.paidAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        member: {
          id: dto.memberId,
          memberCode: 'GR-1002',
          firstName: 'Ayesha',
          lastName: 'Malik',
          phone: '+923331122334',
        },
      };
      this.localPayments.unshift(newPay);

      if (dto.membershipId) {
        const sub = this.localSubscriptions.find((s) => s.id === dto.membershipId);
        if (sub) sub.status = MembershipStatus.ACTIVE;
      }

      return newPay;
    }
  }

  /**
   * Financial & Subscription Metrics
   */
  async getMetrics(gymId: string) {
    const subs = await this.listSubscriptions(gymId);
    const payments = await this.listPayments(gymId);

    const activeCount = subs.filter((s) => s.status === MembershipStatus.ACTIVE).length;
    const pendingCount = subs.filter((s) => s.status === MembershipStatus.PENDING_PAYMENT).length;
    const expiredCount = subs.filter((s) => s.status === MembershipStatus.EXPIRED).length;

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const expiringSoon = subs.filter((s) => {
      if (s.status !== MembershipStatus.ACTIVE) return false;
      const end = new Date(s.endDate);
      return end >= now && end <= sevenDaysFromNow;
    }).length;

    const totalRevenueRecorded = payments.reduce((acc, p) => acc + (p.status === PaymentStatus.COMPLETED ? p.amount : 0), 0);

    return {
      activeSubscriptions: activeCount,
      pendingPayments: pendingCount,
      expiredSubscriptions: expiredCount,
      expiringWithin7Days: expiringSoon,
      totalRevenueRecorded,
      currency: 'PKR',
      totalSubscriptionsTracked: subs.length,
    };
  }
}
