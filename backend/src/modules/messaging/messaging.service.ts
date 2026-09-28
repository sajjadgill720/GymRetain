import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MessagingProvider,
  MessageCategory,
  SendTemplateMessageParams,
  SendMessageResult,
} from './interfaces/messaging-provider.interface';
import { MockWhatsAppProvider } from './providers/mock-whatsapp.provider';
import { subHours, startOfDay } from 'date-fns';

export interface InboundMessageResponse {
  reply: string;
  member?: {
    id: string;
    name: string;
    phone: string;
    currentStreak: number;
    longestStreak: number;
  };
  matchedKeyword: string;
}

export interface AutomatedMessageDispatchParams {
  gymId: string;
  memberId: string;
  templateName: string;
  category?: MessageCategory;
  parameters: Record<string, string>;
}

export interface DispatchResult {
  success: boolean;
  suppressed?: boolean;
  reason?: string;
  providerMessageId?: string;
  costPaisa?: number;
}

@Injectable()
export class MessagingService {
  private readonly logger = new Logger(MessagingService.name);

  // Dynamic variable streak celebration templates (prevents Meta repetitive template penalties)
  private readonly streakCopyVariations = [
    (name: string, streak: number, gymName: string) =>
      `🔥 Salam ${name}! That's ${streak} days in a row at ${gymName}! Momentum is everything—keep the flame alive! 💪`,

    (name: string, streak: number, gymName: string) =>
      `⚡ Unstoppable! ${name}, you just locked in a ${streak}-day workout streak at ${gymName}. Outstanding consistency! 🏋️‍♂️`,

    (name: string, streak: number, gymName: string) =>
      `🏆 Day ${streak} in the books, ${name}! You're currently among the most consistent athletes at ${gymName}. See you tomorrow! 🥊`,

    (name: string, streak: number, gymName: string) =>
      `Salam ${name} bhai! ${streak} days strong at ${gymName}. Discipline turns into results. Shabaash! 🔥`,

    (name: string, streak: number, gymName: string) =>
      `🎯 Streak milestone alert! ${streak} consecutive workout days recorded for ${name} at ${gymName}. Keep crushing your goals! 🚀`,
  ];

  // Core Meta-approved system templates
  public readonly coreTemplates = {
    STREAK_CELEBRATION: {
      name: 'streak_celebration',
      category: 'UTILITY' as MessageCategory,
      metaId: 'meta_streak_v1',
    },
    MISSED_VISIT_NUDGE: {
      name: 'missed_visit_nudge',
      category: 'MARKETING' as MessageCategory,
      metaId: 'meta_missed_visit_v1',
    },
    PAYMENT_REMINDER: {
      name: 'payment_reminder',
      category: 'UTILITY' as MessageCategory,
      metaId: 'meta_payment_reminder_v1',
    },
    REWARD_UNLOCKED: {
      name: 'reward_unlocked',
      category: 'UTILITY' as MessageCategory,
      metaId: 'meta_reward_unlocked_v1',
    },
  };

  private readonly fallbackProvider: MessagingProvider;

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    @Inject('MessagingProvider')
    private readonly provider?: MessagingProvider,
  ) {
    this.fallbackProvider = provider || new MockWhatsAppProvider();
  }

  getDynamicStreakMessage(name: string, streak: number, gymName: string): string {
    const index = Math.abs(streak - 1) % this.streakCopyVariations.length;
    return this.streakCopyVariations[index](name, streak, gymName);
  }

  /**
   * Inbound WhatsApp Keyword Handler:
   * 1. Opt-out (STOP) enforcement (TCPA & Meta Compliance)
   * 2. Opt-in (START) re-activation
   * 3. Member status self-service (STREAK, STATUS, PROGRESS)
   * 4. Strict server-side gym resolution
   */
  async handleInboundWhatsAppMessage(
    senderPhone: string,
    messageBody: string,
    gymId?: string,
    recipientGymPhone?: string,
  ): Promise<InboundMessageResponse> {
    const normalizedBody = messageBody.trim().toUpperCase();

    // 1. Resolve Gym strictly server-side if recipientGymPhone (body.To) is provided
    let resolvedGymId = gymId;
    if (recipientGymPhone) {
      const matchedGym = await this.prisma.gym.findFirst({
        where: { phone: recipientGymPhone },
        select: { id: true },
      });
      if (matchedGym) {
        resolvedGymId = matchedGym.id;
      }
    }

    // 2. Look up member
    const member = await this.prisma.member.findFirst({
      where: {
        phone: senderPhone,
        ...(resolvedGymId ? { gymId: resolvedGymId } : {}),
      },
      include: {
        gym: true,
        streak: true,
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      return {
        reply: `Salam! Your phone number (${senderPhone}) is not registered with an active gym account. Please visit the front desk to enroll!`,
        matchedKeyword: 'UNKNOWN_MEMBER',
      };
    }

    const gymName = member.gym.name;

    // 3. SECURITY & COMPLIANCE: STOP / UNSUBSCRIBE (Opt-out enforcement)
    const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'QUIT', 'END'];
    if (optOutKeywords.includes(normalizedBody)) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: {
          isOptedOut: true,
          optedOutAt: new Date(),
        },
      });

      this.logger.warn(`Member ${member.id} (${senderPhone}) opted out of WhatsApp messages.`);

      return {
        reply: `You have successfully unsubscribed from automated WhatsApp updates from ${gymName}. You will no longer receive workout streak notifications or reminders. Reply START to resubscribe anytime.`,
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          currentStreak: member.streak?.currentStreak || 0,
          longestStreak: member.streak?.longestStreak || 0,
        },
        matchedKeyword: 'STOP',
      };
    }

    // 4. Opt-in re-activation: START / UNSTOP
    const optInKeywords = ['START', 'UNSTOP', 'SUBSCRIBE'];
    if (optInKeywords.includes(normalizedBody)) {
      await this.prisma.member.update({
        where: { id: member.id },
        data: {
          isOptedOut: false,
          optedOutAt: null,
        },
      });

      this.logger.log(`Member ${member.id} (${senderPhone}) resubscribed to WhatsApp messages.`);

      return {
        reply: `Salam ${member.firstName}! Welcome back! You are now resubscribed to ${gymName} workout streak notifications and milestone rewards on WhatsApp. 💪`,
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          currentStreak: member.streak?.currentStreak || 0,
          longestStreak: member.streak?.longestStreak || 0,
        },
        matchedKeyword: 'START',
      };
    }

    // 5. STREAK / STATUS / PROGRESS keyword
    const currentStreak = member.streak?.currentStreak || 0;
    const longestStreak = member.streak?.longestStreak || 0;
    const activePlan = member.memberships?.[0];

    if (
      normalizedBody.includes('STREAK') ||
      normalizedBody.includes('STATUS') ||
      normalizedBody.includes('PROGRESS')
    ) {
      const nextMilestone = currentStreak < 10 ? 10 : currentStreak < 15 ? 15 : 25;
      const daysToMilestone = Math.max(0, nextMilestone - currentStreak);

      const reply = [
        `🔥 *${gymName} Member Status*`,
        `Salam ${member.firstName}! Here is your attendance summary:`,
        ``,
        `• *Current Streak:* ${currentStreak} consecutive days`,
        `• *Personal Best:* ${longestStreak} days`,
        `• *Active Plan:* ${activePlan ? activePlan.planName : 'Standard Membership'}`,
        daysToMilestone > 0
          ? `• *Next Reward:* ${daysToMilestone} more days until the ${nextMilestone}-Day Streak Milestone! 🎁`
          : `• *Milestone Reached:* Congratulations on holding a milestone streak! 🏆`,
        ``,
        `Drop by today to keep your streak going! 💪`,
      ].join('\n');

      return {
        reply,
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          currentStreak,
          longestStreak,
        },
        matchedKeyword: 'STREAK',
      };
    }

    // 6. Default Help / Menu
    const defaultReply = [
      `Salam ${member.firstName}! Welcome to *${gymName}* on WhatsApp.`,
      ``,
      `Reply with:`,
      `• *STREAK* — View your active workout streak & badge progress`,
      `• *STATUS* — Check membership expiration date`,
      `• *HELP* — Speak with front-desk reception (${member.gym.phone})`,
      `• *STOP* — Opt out of automated notifications`,
    ].join('\n');

    return {
      reply: defaultReply,
      member: {
        id: member.id,
        name: `${member.firstName} ${member.lastName}`,
        phone: member.phone,
        currentStreak,
        longestStreak,
      },
      matchedKeyword: 'HELP',
    };
  }

  /**
   * Dispatches an automated template message with:
   * 1. Opt-out check (TCPA compliance)
   * 2. 24-hour deduplication / cooldown check
   * 3. Per-member daily cap (max 1/day)
   * 4. Per-gym daily cap (max 200/day)
   * 5. Audit logging to whatsapp_messages_log
   * 6. Bounded retries (max 3)
   */
  async sendAutomatedTemplateMessage(
    params: AutomatedMessageDispatchParams,
  ): Promise<DispatchResult> {
    const { gymId, memberId, templateName, parameters } = params;
    const category: MessageCategory = params.category || 'UTILITY';

    // 1. Resolve Member and verify tenant ownership
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
      include: { gym: true },
    });

    if (!member) {
      throw new NotFoundException(`Member ${memberId} not found in gym ${gymId}`);
    }

    // 2. SAFETY CHECK: Opt-Out Enforcement
    if (member.isOptedOut) {
      this.logger.warn(`Suppressed send: Member ${member.id} has opted out of WhatsApp messages.`);
      await this.prisma.whatsAppMessageLog.create({
        data: {
          gymId,
          memberId,
          templateId: templateName,
          templateName,
          recipientPhone: member.phone,
          messageCategory: category,
          status: 'FAILED',
          errorMessage: 'SUPPRESSED_MEMBER_OPTED_OUT',
        },
      });
      return { success: false, suppressed: true, reason: 'MEMBER_OPTED_OUT' };
    }

    // 3. CORRECTNESS CHECK: 24-Hour Deduplication & Cooldown
    const twentyFourHoursAgo = subHours(new Date(), 24);
    const recentSent = await this.prisma.whatsAppMessageLog.findFirst({
      where: {
        gymId,
        memberId,
        templateName,
        createdAt: { gte: twentyFourHoursAgo },
        status: { in: ['SENT', 'DELIVERED', 'QUEUED'] },
      },
    });

    if (recentSent) {
      this.logger.warn(
        `Suppressed duplicate: Member ${member.id} already received "${templateName}" in the last 24h.`,
      );
      return { success: false, suppressed: true, reason: 'COOLDOWN_ACTIVE' };
    }

    // 4. SAFETY LIMITS: Per-Member Daily Cap (Max 1 automated message/day)
    const todayStart = startOfDay(new Date());
    const memberTodayCount = await this.prisma.whatsAppMessageLog.count({
      where: {
        memberId,
        createdAt: { gte: todayStart },
        status: { in: ['SENT', 'DELIVERED', 'QUEUED'] },
      },
    });

    if (memberTodayCount >= 1) {
      this.logger.warn(`Suppressed send: Member ${member.id} reached daily cap (max 1 message/day).`);
      return { success: false, suppressed: true, reason: 'DAILY_MEMBER_CAP_REACHED' };
    }

    // 5. SAFETY LIMITS: Per-Gym Daily Cap (Max 200 messages/day)
    const gymTodayCount = await this.prisma.whatsAppMessageLog.count({
      where: {
        gymId,
        createdAt: { gte: todayStart },
        status: { in: ['SENT', 'DELIVERED', 'QUEUED'] },
      },
    });

    if (gymTodayCount >= 200) {
      this.logger.error(`Suppressed send: Gym ${gymId} reached daily cap (max 200 messages/day).`);
      return { success: false, suppressed: true, reason: 'DAILY_GYM_CAP_REACHED' };
    }

    // 6. DISPATCH VIA PROVIDER WITH BOUNDED RETRIES (Max 3 attempts)
    const providerInstance = this.provider || this.fallbackProvider;
    let attempt = 0;
    let sendResult: SendMessageResult | null = null;
    const maxRetries = 3;

    while (attempt < maxRetries) {
      attempt++;
      sendResult = await providerInstance.sendTemplateMessage({
        gymId,
        recipientPhone: member.phone,
        templateId: templateName,
        templateName,
        category,
        parameters,
        memberId,
      });

      if (sendResult.status === 'SENT' || sendResult.status === 'QUEUED') {
        break;
      }
      this.logger.warn(
        `Send attempt ${attempt} failed for member ${member.id}: ${sendResult.errorMessage}`,
      );
    }

    // 7. RECORD IMMUTABLE LOG IN DATABASE
    const logRecord = await this.prisma.whatsAppMessageLog.create({
      data: {
        gymId,
        memberId,
        templateId: templateName,
        templateName,
        recipientPhone: member.phone,
        messageCategory: category,
        status: sendResult?.status === 'SENT' ? 'SENT' : 'FAILED',
        provider: 'TWILIO',
        providerMessageId: sendResult?.providerMessageId,
        costPaisa: sendResult?.costPaisa,
        errorMessage: sendResult?.status === 'FAILED' ? sendResult.errorMessage : null,
        sentAt: sendResult?.status === 'SENT' ? new Date() : undefined,
      },
    });

    return {
      success: logRecord.status === 'SENT',
      providerMessageId: logRecord.providerMessageId || undefined,
      costPaisa: logRecord.costPaisa || undefined,
      reason: logRecord.errorMessage || undefined,
    };
  }

  /**
   * Delivery Status Webhook Handler:
   * Updates message delivery state (DELIVERED, READ, FAILED) from provider callbacks
   */
  async handleDeliveryStatusWebhook(payload: any) {
    const providerMessageId = payload.MessageSid || payload.messageId || payload.id;
    const rawStatus = (payload.MessageStatus || payload.status || '').toLowerCase();

    if (!providerMessageId) {
      return { success: false, error: 'Missing providerMessageId' };
    }

    let mappedStatus: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' = 'SENT';
    if (rawStatus === 'delivered') mappedStatus = 'DELIVERED';
    else if (rawStatus === 'read') mappedStatus = 'READ';
    else if (rawStatus === 'failed' || rawStatus === 'undelivered') mappedStatus = 'FAILED';

    const existingLog = await this.prisma.whatsAppMessageLog.findFirst({
      where: { providerMessageId },
    });

    if (existingLog) {
      await this.prisma.whatsAppMessageLog.update({
        where: { id: existingLog.id },
        data: {
          status: mappedStatus,
          errorMessage: payload.ErrorMessage || payload.error,
        },
      });
      this.logger.log(`Updated message ${providerMessageId} status to ${mappedStatus}`);
    }

    return { success: true, status: mappedStatus };
  }

  /**
   * Cost Visibility Report:
   * Aggregates message counts, categories, delivery rates, and Meta expenditures
   */
  async getCostSummary(gymId: string, days = 30) {
    const sinceDate = subHours(new Date(), days * 24);

    const logs = await this.prisma.whatsAppMessageLog.findMany({
      where: {
        gymId,
        createdAt: { gte: sinceDate },
      },
    });

    const totalSent = logs.length;
    const deliveredCount = logs.filter((l) => l.status === 'DELIVERED' || l.status === 'READ').length;
    const failedCount = logs.filter((l) => l.status === 'FAILED').length;

    let utilityCount = 0;
    let marketingCount = 0;
    let totalCostPaisa = 0;

    for (const log of logs) {
      if (log.messageCategory === 'UTILITY') utilityCount++;
      if (log.messageCategory === 'MARKETING') marketingCount++;
      totalCostPaisa += log.costPaisa || 0;
    }

    return {
      periodDays: days,
      summary: {
        totalMessages: totalSent,
        deliveredCount,
        failedCount,
        deliveryRatePercent: totalSent > 0 ? Math.round((deliveredCount / totalSent) * 100) : 100,
        utilityCount,
        marketingCount,
        totalCostPaisa,
        totalCostPkr: (totalCostPaisa / 100).toFixed(2),
        currency: 'PKR',
      },
    };
  }
}
