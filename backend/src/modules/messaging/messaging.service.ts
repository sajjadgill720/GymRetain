import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generates dynamic, non-repetitive copy for streak celebration WhatsApp notifications
   */
  getDynamicStreakMessage(name: string, streak: number, gymName: string): string {
    const index = Math.abs(streak - 1) % this.streakCopyVariations.length;
    return this.streakCopyVariations[index](name, streak, gymName);
  }

  /**
   * Inbound WhatsApp Keyword Handler:
   * When members send "STREAK", "STATUS", or "PROGRESS" via WhatsApp,
   * reply with their current workout stats without needing an app login.
   */
  async handleInboundWhatsAppMessage(
    senderPhone: string,
    messageBody: string,
    gymId?: string,
  ): Promise<InboundMessageResponse> {
    const normalizedBody = messageBody.trim().toUpperCase();

    // Look up member by phone number
    const member = await this.prisma.member.findFirst({
      where: {
        phone: senderPhone,
        ...(gymId ? { gymId } : {}),
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

    const currentStreak = member.streak?.currentStreak || 0;
    const longestStreak = member.streak?.longestStreak || 0;
    const gymName = member.gym.name;
    const activePlan = member.memberships[0];

    // 1. STREAK / STATUS / PROGRESS keyword
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

    // 2. Default Help / Menu
    const defaultReply = [
      `Salam ${member.firstName}! Welcome to *${gymName}* on WhatsApp.`,
      ``,
      `Reply with:`,
      `• *STREAK* — View your active workout streak & badge progress`,
      `• *STATUS* — Check membership expiration date`,
      `• *HELP* — Speak with front-desk reception (${member.gym.phone})`,
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
}
