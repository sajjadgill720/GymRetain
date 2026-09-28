import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from './messaging.service';
import { subDays, startOfDay } from 'date-fns';

@Injectable()
export class AutomationTriggerService {
  private readonly logger = new Logger(AutomationTriggerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Event-Driven Trigger: Reward Unlocked
   * Fires immediately when a member unlocks a streak milestone reward
   */
  async triggerRewardUnlockedNotification(
    gymId: string,
    memberId: string,
    rewardTitle: string,
  ) {
    this.logger.log(`Firing event-driven reward notification for member ${memberId}: "${rewardTitle}"`);

    return this.messagingService.sendAutomatedTemplateMessage({
      gymId,
      memberId,
      templateName: this.messagingService.coreTemplates.REWARD_UNLOCKED.name,
      category: this.messagingService.coreTemplates.REWARD_UNLOCKED.category,
      parameters: {
        rewardTitle,
      },
    });
  }

  /**
   * Event-Driven Trigger: Streak Milestone Celebration
   * Fires on check-in when a streak reaches key milestones
   */
  async triggerStreakCelebration(
    gymId: string,
    memberId: string,
    streak: number,
  ) {
    const milestones = [3, 5, 7, 10, 14, 21, 30, 60, 90, 100];
    if (!milestones.includes(streak)) {
      return null;
    }

    this.logger.log(`Firing streak celebration for member ${memberId}: Streak ${streak}`);

    return this.messagingService.sendAutomatedTemplateMessage({
      gymId,
      memberId,
      templateName: this.messagingService.coreTemplates.STREAK_CELEBRATION.name,
      category: this.messagingService.coreTemplates.STREAK_CELEBRATION.category,
      parameters: {
        streak: streak.toString(),
      },
    });
  }

  /**
   * Batch / Scheduled Trigger: Missed Visit Nudge
   * Evaluates active members who have not visited in >= 5 days
   */
  async triggerMissedVisitNudges(gymId: string) {
    const fiveDaysAgo = subDays(new Date(), 5);

    // Find active members whose last check-in was >= 5 days ago (or no check-ins since joining)
    const inactiveMembers = await this.prisma.member.findMany({
      where: {
        gymId,
        status: 'ACTIVE',
        isOptedOut: false,
        OR: [
          {
            streak: {
              lastCheckInDate: { lte: startOfDay(fiveDaysAgo) },
            },
          },
          {
            checkIns: { none: {} },
            joinDate: { lte: startOfDay(fiveDaysAgo) },
          },
        ],
      },
      include: { streak: true },
      take: 50,
    });

    this.logger.log(`Found ${inactiveMembers.length} missed-visit candidates in gym ${gymId}`);

    const results = [];
    for (const member of inactiveMembers) {
      const daysSince = member.streak?.lastCheckInDate
        ? Math.floor((Date.now() - member.streak.lastCheckInDate.getTime()) / (1000 * 60 * 60 * 24))
        : 7;

      const result = await this.messagingService.sendAutomatedTemplateMessage({
        gymId,
        memberId: member.id,
        templateName: this.messagingService.coreTemplates.MISSED_VISIT_NUDGE.name,
        category: this.messagingService.coreTemplates.MISSED_VISIT_NUDGE.category,
        parameters: {
          daysSince: daysSince.toString(),
          memberName: member.firstName,
        },
      });

      results.push({ memberId: member.id, ...result });
    }

    return {
      evaluatedCount: inactiveMembers.length,
      dispatchedResults: results,
    };
  }

  /**
   * Batch / Scheduled Trigger: Payment Overdue & Expiration Reminder
   * Finds members with active or pending payment memberships due/overdue
   */
  async triggerPaymentReminders(gymId: string) {
    const today = startOfDay(new Date());

    const overdueMemberships = await this.prisma.membership.findMany({
      where: {
        gymId,
        OR: [
          { status: 'PENDING_PAYMENT' },
          { endDate: { lte: today }, status: 'ACTIVE' },
        ],
      },
      include: { member: true },
      take: 50,
    });

    this.logger.log(`Found ${overdueMemberships.length} payment reminder candidates in gym ${gymId}`);

    const results = [];
    for (const ms of overdueMemberships) {
      if (ms.member.isOptedOut) continue;

      const result = await this.messagingService.sendAutomatedTemplateMessage({
        gymId,
        memberId: ms.memberId,
        templateName: this.messagingService.coreTemplates.PAYMENT_REMINDER.name,
        category: this.messagingService.coreTemplates.PAYMENT_REMINDER.category,
        parameters: {
          planName: ms.planName,
          amountPaisa: ms.price.toString(),
        },
      });

      results.push({ memberId: ms.memberId, ...result });
    }

    return {
      evaluatedCount: overdueMemberships.length,
      dispatchedResults: results,
    };
  }
}
