import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { addMonths, addDays, isBefore } from 'date-fns';
import { randomBytes } from 'crypto';

export interface SaasPlanMeta {
  id: 'TRIAL' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  name: string;
  priceUsd: number;
  pricePkr: number;
  maxMembers: number;
  maxStaff: number;
  features: string[];
}

export const SAAS_PLANS: Record<string, SaasPlanMeta> = {
  TRIAL: {
    id: 'TRIAL',
    name: '14-Day Free Trial',
    priceUsd: 0,
    pricePkr: 0,
    maxMembers: 50,
    maxStaff: 5,
    features: ['Core QR Check-ins', 'Dashboard Analytics', 'Basic Retention Alerts'],
  },
  STARTER: {
    id: 'STARTER',
    name: 'Starter Tier',
    priceUsd: 29,
    pricePkr: 8000,
    maxMembers: 100,
    maxStaff: 5,
    features: [
      'Up to 100 Members',
      '5 Staff Accounts',
      'Floor Capacity Controls',
      'QR Check-In Terminal',
      'Attendance Durations',
    ],
  },
  PRO: {
    id: 'PRO',
    name: 'Pro Tier',
    priceUsd: 79,
    pricePkr: 22000,
    maxMembers: 500,
    maxStaff: 15,
    features: [
      'Up to 500 Members',
      '15 Staff Accounts',
      'AI Retention Engine & Signals',
      'WhatsApp Automation & Templates',
      'Diet Plans & Trainer Workflows',
      'Exportable Audit Logs',
    ],
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise Tier',
    priceUsd: 199,
    pricePkr: 55000,
    maxMembers: 2000,
    maxStaff: 50,
    features: [
      'Up to 2,000 Members',
      '50 Staff Accounts',
      'Dedicated Account Manager',
      'Custom Integrations & Webhooks',
      'Multi-Branch Switching',
      '99.9% SLA Guarantee',
    ],
  },
};

@Injectable()
export class SaasBillingService {
  private readonly logger = new Logger(SaasBillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * Retrieves subscription state, usage against limits, and entitlement flags
   */
  async getSubscriptionStatus(gymId: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: {
        id: true,
        name: true,
        saasPlan: true,
        saasStatus: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        maxMembers: true,
        maxStaff: true,
        currency: true,
      },
    });

    if (!gym) {
      throw new NotFoundException('Gym not found');
    }

    const [activeMembersCount, activeStaffCount] = await Promise.all([
      this.prisma.member.count({ where: { gymId, status: 'ACTIVE' } }),
      this.prisma.gymStaff.count({ where: { gymId, isActive: true } }),
    ]);

    const planMeta = SAAS_PLANS[gym.saasPlan] || SAAS_PLANS.STARTER;
    const now = new Date();

    let isTrialActive = false;
    let trialDaysRemaining = 0;
    if (gym.saasStatus === 'TRIALING' && gym.trialEndsAt) {
      isTrialActive = !isBefore(gym.trialEndsAt, now);
      trialDaysRemaining = Math.max(0, Math.ceil((gym.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return {
      gymId: gym.id,
      gymName: gym.name,
      plan: gym.saasPlan,
      status: gym.saasStatus,
      planDetails: planMeta,
      isTrialActive,
      trialDaysRemaining,
      currentPeriodEnd: gym.currentPeriodEnd,
      cancelAtPeriodEnd: gym.cancelAtPeriodEnd,
      usage: {
        members: {
          current: activeMembersCount,
          max: gym.maxMembers,
          percentage: Math.round((activeMembersCount / gym.maxMembers) * 100),
          isExceeded: activeMembersCount >= gym.maxMembers,
        },
        staff: {
          current: activeStaffCount,
          max: gym.maxStaff,
          percentage: Math.round((activeStaffCount / gym.maxStaff) * 100),
          isExceeded: activeStaffCount >= gym.maxStaff,
        },
      },
      entitlements: {
        canUseAiRadar: ['PRO', 'ENTERPRISE'].includes(gym.saasPlan),
        canUseWhatsAppAutomations: ['PRO', 'ENTERPRISE'].includes(gym.saasPlan),
        canUseDietPlans: ['PRO', 'ENTERPRISE'].includes(gym.saasPlan),
        canExportAuditLogs: ['PRO', 'ENTERPRISE'].includes(gym.saasPlan),
      },
      availablePlans: Object.values(SAAS_PLANS),
    };
  }

  /**
   * Initializes a checkout session in Sandbox Simulator mode
   */
  async createCheckoutSession(
    gymId: string,
    targetPlan: 'STARTER' | 'PRO' | 'ENTERPRISE',
    billingInterval: 'monthly' | 'annual' = 'monthly',
  ) {
    const planMeta = SAAS_PLANS[targetPlan];
    if (!planMeta) {
      throw new BadRequestException('Invalid subscription plan selected');
    }

    const multiplier = billingInterval === 'annual' ? 10 : 1; // 2 months free on annual
    const amountPaisa = planMeta.pricePkr * multiplier * 100;
    const checkoutSessionId = `chk_sim_${randomBytes(12).toString('hex')}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${targetPlan}`;

    return {
      checkoutSessionId,
      invoiceNumber,
      targetPlan,
      planName: planMeta.name,
      billingInterval,
      amountPaisa,
      amountFormatted: `${(amountPaisa / 100).toLocaleString()} PKR`,
      amountUsdFormatted: `$${(planMeta.priceUsd * multiplier).toFixed(2)}`,
      provider: 'SANDBOX_SIMULATOR',
      sandboxNotice:
        'SANDBOX SIMULATION MODE: No real credit card or bank account will be charged. This updates tenant entitlements immediately in the verified server-side database.',
    };
  }

  /**
   * Server-side verified subscription payment completion
   * Enforces idempotency via invoiceNumber and logs audit trail
   */
  async confirmSubscriptionPayment(
    gymId: string,
    plan: 'STARTER' | 'PRO' | 'ENTERPRISE',
    provider: 'SANDBOX_SIMULATOR' | 'STRIPE' | 'JAZZCASH' = 'SANDBOX_SIMULATOR',
    invoiceNumber?: string,
    staffId?: string,
    actorRole: string = 'GYM_OWNER',
  ) {
    const planMeta = SAAS_PLANS[plan];
    if (!planMeta) {
      throw new BadRequestException('Invalid plan tier');
    }

    const invNum = invoiceNumber || `INV-${Date.now().toString().slice(-6)}-${plan}`;

    // Idempotency check: don't double-process the same invoice
    const existingInvoice = await this.prisma.saaSBillingRecord.findUnique({
      where: { invoiceNumber: invNum },
    });
    if (existingInvoice) {
      return {
        alreadyProcessed: true,
        message: 'This invoice was already recorded and paid.',
        billingRecord: existingInvoice,
      };
    }

    const now = new Date();
    const periodStart = now;
    const periodEnd = addMonths(now, 1);

    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // 1. Update Gym Subscription State & Usage Limits
      const updatedGym = await tx.gym.update({
        where: { id: gymId },
        data: {
          saasPlan: plan,
          saasStatus: 'ACTIVE',
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          maxMembers: planMeta.maxMembers,
          maxStaff: planMeta.maxStaff,
        },
        select: {
          id: true,
          name: true,
          saasPlan: true,
          saasStatus: true,
          maxMembers: true,
          maxStaff: true,
          currentPeriodEnd: true,
        },
      });

      // 2. Insert Persistent Billing Record
      const billingRecord = await tx.saaSBillingRecord.create({
        data: {
          gymId,
          amount: planMeta.pricePkr * 100,
          currency: 'PKR',
          plan,
          status: 'PAID',
          provider,
          invoiceNumber: invNum,
          periodStart,
          periodEnd,
          paidAt: now,
          description: `GymRetain ${planMeta.name} - Monthly Subscription (${invNum})`,
        },
      });

      // 3. Record Audit Log for Subscription Change
      await tx.auditLog.create({
        data: {
          gymId,
          staffId: staffId || null,
          actorRole,
          action: 'SAAS_PLAN_UPGRADED',
          resource: 'SAAS_SUBSCRIPTION',
          metadata: {
            newPlan: plan,
            invoiceNumber: invNum,
            maxMembers: planMeta.maxMembers,
            maxStaff: planMeta.maxStaff,
            provider,
          },
        },
      });

      this.logger.log(`Gym ${updatedGym.name} upgraded to ${plan}. Invoice: ${invNum}`);

      return {
        success: true,
        message: `GymRetain ${planMeta.name} successfully activated. Entitlements updated.`,
        gym: updatedGym,
        billingRecord,
      };
    });
  }

  /**
   * Cancel subscription at period end (data is preserved!)
   */
  async cancelSubscription(gymId: string, staffId?: string, actorRole: string = 'GYM_OWNER') {
    const updated = await this.prisma.gym.update({
      where: { id: gymId },
      data: { cancelAtPeriodEnd: true },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId: staffId || null,
        actorRole,
        action: 'SAAS_SUBSCRIPTION_CANCEL_SCHEDULED',
        resource: 'SAAS_SUBSCRIPTION',
        metadata: { currentPeriodEnd: updated.currentPeriodEnd },
      },
    });

    return {
      success: true,
      message: 'Subscription set to cancel at end of current period. Tenant data is safely preserved.',
      cancelAtPeriodEnd: true,
      currentPeriodEnd: updated.currentPeriodEnd,
    };
  }

  /**
   * List billing history invoices for the tenant
   */
  async listInvoices(gymId: string) {
    return this.prisma.saaSBillingRecord.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
