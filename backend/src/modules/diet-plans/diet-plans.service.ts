import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagingService } from '../messaging/messaging.service';
import { CreateDietPlanDto } from './dto/create-diet-plan.dto';
import { UpdateDietPlanDto } from './dto/update-diet-plan.dto';
import { CloneTemplateDto } from './dto/clone-template.dto';
import { CreateDietTemplateDto } from './dto/create-template.dto';

@Injectable()
export class DietPlansService {
  private readonly logger = new Logger(DietPlansService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Helper to format meal-by-meal structured text for WhatsApp delivery
   */
  private formatMealsText(meals: any[]): string {
    if (!meals || meals.length === 0) {
      return 'No specific meals recorded.';
    }

    const emojiMap: Record<string, string> = {
      BREAKFAST: '🍳',
      LUNCH: '🥗',
      DINNER: '🥩',
      SNACK: '🍎',
    };

    return meals
      .map((m, idx) => {
        const emoji = emojiMap[m.mealType] || '🍽️';
        let line = `${emoji} *${m.mealType}*: ${m.description}`;
        const macros: string[] = [];
        if (m.calories) macros.push(`${m.calories} kcal`);
        if (m.proteinG) macros.push(`${m.proteinG}g P`);
        if (m.carbsG) macros.push(`${m.carbsG}g C`);
        if (m.fatG) macros.push(`${m.fatG}g F`);
        if (macros.length > 0) {
          line += ` (${macros.join(' | ')})`;
        }
        return line;
      })
      .join('\n');
  }

  /**
   * Create a new diet plan for a member.
   * If a trainer role creates it, validates active assignment.
   * Automatically deactivates any existing active plan (versioning).
   */
  async createDietPlan(
    gymId: string,
    creatorStaffId: string,
    creatorRole: string,
    dto: CreateDietPlanDto,
  ) {
    // 1. Verify member exists in this gym
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
      include: { gym: true },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this gym');
    }

    // 2. Authorization check: if trainer, verify active assignment
    if (creatorRole === 'TRAINER') {
      const isAssigned = await this.prisma.trainerAssignment.findFirst({
        where: {
          gymId,
          memberId: dto.memberId,
          trainerId: creatorStaffId,
          isActive: true,
        },
      });
      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied: You can only create diet plans for members actively assigned to you',
        );
      }
    }

    // 3. Atomically deactivate prior active plans and insert new active plan + meals
    const newPlan = await this.prisma.$transaction(async (tx) => {
      // Deactivate previous active plan(s)
      await tx.dietPlan.updateMany({
        where: {
          gymId,
          memberId: dto.memberId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      // Create new plan
      const plan = await tx.dietPlan.create({
        data: {
          gymId,
          memberId: dto.memberId,
          createdById: creatorStaffId,
          title: dto.title,
          goal: dto.goal,
          customGoal: dto.customGoal,
          notes: dto.notes,
          isActive: true,
        },
      });

      // Insert meals with orderIndex
      if (dto.meals && dto.meals.length > 0) {
        await tx.dietPlanMeal.createMany({
          data: dto.meals.map((meal, index) => ({
            dietPlanId: plan.id,
            mealType: meal.mealType,
            description: meal.description,
            calories: meal.calories,
            proteinG: meal.proteinG,
            carbsG: meal.carbsG,
            fatG: meal.fatG,
            orderIndex: meal.orderIndex ?? index,
          })),
        });
      }

      return tx.dietPlan.findUnique({
        where: { id: plan.id },
        include: {
          meals: { orderBy: { orderIndex: 'asc' } },
          createdBy: { select: { id: true, name: true, role: true } },
          member: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });
    });

    this.logger.log(
      `Created diet plan "${dto.title}" for member ${member.firstName} ${member.lastName} by staff ${creatorStaffId}`,
    );

    // 4. Member-facing WhatsApp Delivery via existing MessagingProvider
    if (dto.sendWhatsAppNotification !== false && member.phone) {
      try {
        const mealsText = this.formatMealsText(dto.meals);
        const goalDisplay = dto.goal === 'CUSTOM' && dto.customGoal ? dto.customGoal : dto.goal;

        await this.messagingService.sendAutomatedTemplateMessage({
          gymId,
          memberId: member.id,
          templateName: 'diet_plan_assigned',
          category: 'UTILITY',
          parameters: {
            memberName: member.firstName,
            planTitle: dto.title,
            goal: goalDisplay,
            mealsSummary: mealsText,
            notes: dto.notes || 'Stick to your schedule and stay hydrated!',
            gymName: member.gym?.name || 'Your Gym',
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to dispatch diet plan WhatsApp message: ${err.message}`);
      }
    }

    return newPlan;
  }

  /**
   * Update an existing diet plan. Scoped to assigned trainer or owner/manager.
   */
  async updateDietPlan(
    gymId: string,
    planId: string,
    editorStaffId: string,
    editorRole: string,
    dto: UpdateDietPlanDto,
  ) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id: planId, gymId },
      include: {
        member: { include: { gym: true } },
        meals: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Diet plan not found');
    }

    // Trainer scoping check
    if (editorRole === 'TRAINER') {
      const isAssigned = await this.prisma.trainerAssignment.findFirst({
        where: {
          gymId,
          memberId: plan.memberId,
          trainerId: editorStaffId,
          isActive: true,
        },
      });
      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied: You can only edit diet plans for members actively assigned to you',
        );
      }
    }

    // Execute update in transaction
    const updatedPlan = await this.prisma.$transaction(async (tx) => {
      // If plan is set to active, deactivate all other plans for this member
      if (dto.isActive === true) {
        await tx.dietPlan.updateMany({
          where: {
            gymId,
            memberId: plan.memberId,
            id: { not: planId },
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      await tx.dietPlan.update({
        where: { id: planId },
        data: {
          ...(dto.title ? { title: dto.title } : {}),
          ...(dto.goal ? { goal: dto.goal } : {}),
          ...(dto.customGoal !== undefined ? { customGoal: dto.customGoal } : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      // If new meals provided, replace existing meals
      if (dto.meals) {
        await tx.dietPlanMeal.deleteMany({ where: { dietPlanId: planId } });
        await tx.dietPlanMeal.createMany({
          data: dto.meals.map((m, idx) => ({
            dietPlanId: planId,
            mealType: m.mealType,
            description: m.description,
            calories: m.calories,
            proteinG: m.proteinG,
            carbsG: m.carbsG,
            fatG: m.fatG,
            orderIndex: m.orderIndex ?? idx,
          })),
        });
      }

      return tx.dietPlan.findUnique({
        where: { id: planId },
        include: {
          meals: { orderBy: { orderIndex: 'asc' } },
          createdBy: { select: { id: true, name: true, role: true } },
          member: {
            select: { id: true, firstName: true, lastName: true, phone: true },
          },
        },
      });
    });

    // Optional WhatsApp dispatch on update
    if (dto.sendWhatsAppNotification && plan.member?.phone) {
      try {
        const mealsText = this.formatMealsText(dto.meals || plan.meals);
        const goalDisplay =
          updatedPlan?.goal === 'CUSTOM' && updatedPlan?.customGoal
            ? updatedPlan.customGoal
            : updatedPlan?.goal || 'MAINTENANCE';

        await this.messagingService.sendAutomatedTemplateMessage({
          gymId,
          memberId: plan.memberId,
          templateName: 'diet_plan_assigned',
          category: 'UTILITY',
          parameters: {
            memberName: plan.member.firstName,
            planTitle: updatedPlan?.title || 'Diet Plan',
            goal: goalDisplay,
            mealsSummary: mealsText,
            notes: updatedPlan?.notes || 'Your diet plan has been updated.',
            gymName: plan.member.gym?.name || 'Your Gym',
          },
        });
      } catch (err: any) {
        this.logger.error(`Failed to dispatch diet plan update WhatsApp: ${err.message}`);
      }
    }

    return updatedPlan;
  }

  /**
   * Get a single diet plan by ID (scoped to assigned trainer or owner/manager)
   */
  async getDietPlanById(
    gymId: string,
    planId: string,
    viewerStaffId: string,
    viewerRole: string,
  ) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id: planId, gymId },
      include: {
        meals: { orderBy: { orderIndex: 'asc' } },
        createdBy: { select: { id: true, name: true, role: true } },
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            phone: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Diet plan not found');
    }

    if (viewerRole === 'TRAINER') {
      const isAssigned = await this.prisma.trainerAssignment.findFirst({
        where: {
          gymId,
          memberId: plan.memberId,
          trainerId: viewerStaffId,
          isActive: true,
        },
      });
      if (!isAssigned) {
        throw new NotFoundException('Diet plan not found');
      }
    }

    return plan;
  }

  /**
   * List all diet plans (active & historical) for a member
   */
  async listMemberDietPlans(
    gymId: string,
    memberId: string,
    viewerStaffId: string,
    viewerRole: string,
  ) {
    // Trainer scoping check
    if (viewerRole === 'TRAINER') {
      const isAssigned = await this.prisma.trainerAssignment.findFirst({
        where: {
          gymId,
          memberId,
          trainerId: viewerStaffId,
          isActive: true,
        },
      });
      if (!isAssigned) {
        throw new ForbiddenException(
          'Access denied: You are not assigned as trainer to this member',
        );
      }
    }

    return this.prisma.dietPlan.findMany({
      where: { gymId, memberId },
      include: {
        meals: { orderBy: { orderIndex: 'asc' } },
        createdBy: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Clone a pre-defined template into a member's active diet plan
   */
  async cloneFromTemplate(
    gymId: string,
    creatorStaffId: string,
    creatorRole: string,
    dto: CloneTemplateDto,
  ) {
    // 1. Fetch template (either tenant-specific or platform-wide where gym_id IS NULL)
    const template = await this.prisma.dietPlanTemplate.findFirst({
      where: {
        id: dto.templateId,
        OR: [{ gymId }, { gymId: null }],
        isActive: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Diet plan template not found');
    }

    // 2. Parse meals from template JSON
    let parsedMeals: any[] = [];
    if (Array.isArray(template.mealsJson)) {
      parsedMeals = template.mealsJson;
    } else if (typeof template.mealsJson === 'string') {
      try {
        parsedMeals = JSON.parse(template.mealsJson);
      } catch {
        parsedMeals = [];
      }
    }

    // 3. Delegate to createDietPlan with pre-filled fields
    return this.createDietPlan(gymId, creatorStaffId, creatorRole, {
      memberId: dto.memberId,
      title: dto.customTitle || template.title,
      goal: template.goal,
      notes: dto.notes || template.description || undefined,
      meals: parsedMeals,
      sendWhatsAppNotification: dto.sendWhatsAppNotification,
    });
  }

  /**
   * List all available diet plan templates (platform defaults + gym-specific)
   */
  async listTemplates(gymId: string) {
    return this.prisma.dietPlanTemplate.findMany({
      where: {
        OR: [{ gymId }, { gymId: null }],
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new custom template for this gym (Owner/Manager view)
   */
  async createTemplate(gymId: string, dto: CreateDietTemplateDto) {
    return this.prisma.dietPlanTemplate.create({
      data: {
        gymId,
        title: dto.title,
        goal: dto.goal,
        description: dto.description,
        mealsJson: dto.meals as any,
        isActive: true,
      },
    });
  }
}
