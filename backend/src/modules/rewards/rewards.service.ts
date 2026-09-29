import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { Prisma } from '@prisma/client';

import { AutomationTriggerService } from '../messaging/automation-trigger.service';
import { Optional } from '@nestjs/common';

@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Optional()
    private readonly triggerService?: AutomationTriggerService,
  ) {}

  /**
   * List configurable reward rules for this gym
   */
  async listRewards(gymId: string) {
    return this.prisma.reward.findMany({
      where: { gymId },
      orderBy: { triggerThreshold: 'asc' },
      include: {
        _count: {
          select: { redemptions: true },
        },
      },
    });
  }

  /**
   * List all streak reward winners / redemptions across the gym
   */
  async listAllRedemptions(gymId: string) {
    return this.prisma.rewardRedemption.findMany({
      where: { gymId },
      include: {
        reward: true,
        member: {
          select: {
            id: true,
            memberCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            streak: true,
          },
        },
      },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  /**
   * Create a new configurable reward rule for this gym
   */
  async createReward(gymId: string, dto: CreateRewardDto) {
    return this.prisma.reward.create({
      data: {
        gymId,
        title: dto.title,
        description: dto.description,
        rewardType: dto.rewardType,
        triggerType: dto.triggerType,
        triggerThreshold: dto.triggerThreshold,
        rewardValue: dto.rewardValue,
        badgeIcon: dto.badgeIcon,
        isActive: true,
      },
    });
  }

  /**
   * Evaluates streak milestone rewards and unlocks them if not already unlocked
   */
  async evaluateAndUnlockStreakRewards(
    tx: Prisma.TransactionClient,
    gymId: string,
    memberId: string,
    currentStreak: number,
  ) {
    // Find all active streak milestone rewards matching the current streak threshold
    const eligibleRewards = await tx.reward.findMany({
      where: {
        gymId,
        isActive: true,
        triggerType: 'STREAK_MILESTONE',
        triggerThreshold: { lte: currentStreak },
      },
    });

    const newlyUnlocked = [];

    for (const reward of eligibleRewards) {
      // Check if already unlocked for this member
      const existing = await tx.rewardRedemption.findFirst({
        where: {
          gymId,
          memberId,
          rewardId: reward.id,
        },
      });

      if (!existing) {
        const redemption = await tx.rewardRedemption.create({
          data: {
            gymId,
            memberId,
            rewardId: reward.id,
            status: 'UNLOCKED',
            unlockedAt: new Date(),
          },
          include: { reward: true },
        });

        newlyUnlocked.push(redemption);
        this.logger.log(
          `Member ${memberId} unlocked reward: "${reward.title}" (Streak: ${currentStreak})`,
        );

        if (this.triggerService) {
          this.triggerService
            .triggerRewardUnlockedNotification(gymId, memberId, reward.title)
            .catch((err) => {
              this.logger.error(`Failed to dispatch WhatsApp reward notification: ${err.message}`);
            });
        }
      }
    }

    return newlyUnlocked;
  }

  /**
   * List unlocked or redeemed rewards for a member
   */
  async getMemberRedemptions(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.rewardRedemption.findMany({
      where: { gymId, memberId },
      include: { reward: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  /**
   * Redeem an unlocked reward (e.g. at front desk)
   */
  async redeemReward(
    gymId: string,
    redemptionId: string,
    staffId?: string,
    notes?: string,
  ) {
    const redemption = await this.prisma.rewardRedemption.findFirst({
      where: { id: redemptionId, gymId },
      include: { reward: true },
    });

    if (!redemption) {
      throw new NotFoundException('Reward redemption record not found');
    }

    if (redemption.status === 'REDEEMED') {
      throw new ConflictException('This reward has already been redeemed');
    }

    return this.prisma.rewardRedemption.update({
      where: { id: redemptionId },
      data: {
        status: 'REDEEMED',
        redeemedAt: new Date(),
        redeemedByStaffId: staffId,
        notes,
      },
      include: { reward: true },
    });
  }
}
