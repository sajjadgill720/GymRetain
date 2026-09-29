import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DietPlansService } from '../src/modules/diet-plans/diet-plans.service';
import { MessagingService } from '../src/modules/messaging/messaging.service';
import { CreateDietPlanDto } from '../src/modules/diet-plans/dto/create-diet-plan.dto';
import { CloneTemplateDto } from '../src/modules/diet-plans/dto/clone-template.dto';

describe('Diet Plan Builder & WhatsApp Delivery Test Suite', () => {
  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';

  const TRAINER_1_ID = 'trainer-1-uuid';
  const TRAINER_2_ID = 'trainer-2-uuid';
  const OWNER_A_ID = 'owner-a-uuid';

  const MEMBER_A1_ID = 'member-a1-uuid';
  const MEMBER_B1_ID = 'member-b1-uuid';

  let dietPlansService: DietPlansService;
  let mockPrisma: any;
  let mockMessagingService: any;

  // In-memory mock tables
  let dbMembers: any[] = [];
  let dbAssignments: any[] = [];
  let dbDietPlans: any[] = [];
  let dbDietMeals: any[] = [];
  let dbTemplates: any[] = [];
  let dispatchedMessages: any[] = [];

  beforeEach(() => {
    dbMembers = [
      {
        id: MEMBER_A1_ID,
        gymId: GYM_A_ID,
        firstName: 'Ali',
        lastName: 'Ahmed',
        phone: '+923001111111',
        status: 'ACTIVE',
        isOptedOut: false,
        gym: { id: GYM_A_ID, name: 'Iron House Gym' },
      },
      {
        id: MEMBER_B1_ID,
        gymId: GYM_B_ID,
        firstName: 'Zubair',
        lastName: 'Khan',
        phone: '+923002222222',
        status: 'ACTIVE',
        isOptedOut: false,
        gym: { id: GYM_B_ID, name: 'Canary Gym' },
      },
    ];

    // Member A1 is assigned to Trainer 1, NOT Trainer 2
    dbAssignments = [
      {
        id: 'assign-1',
        gymId: GYM_A_ID,
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
        isActive: true,
      },
    ];

    dbDietPlans = [];
    dbDietMeals = [];
    dispatchedMessages = [];

    dbTemplates = [
      {
        id: 'template-weight-loss-1',
        gymId: null, // Global platform template
        title: 'Calorie Deficit Starter',
        goal: 'WEIGHT_LOSS',
        description: 'Standard 1,800 kcal high-protein starter template',
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
            description: '150g grilled chicken breast with cucumber salad',
            calories: 450,
            proteinG: 45,
            carbsG: 10,
            fatG: 12,
            orderIndex: 1,
          },
          {
            mealType: 'DINNER',
            description: '200g white fish, steamed vegetables',
            calories: 380,
            proteinG: 40,
            carbsG: 15,
            fatG: 8,
            orderIndex: 2,
          },
        ],
        isActive: true,
      },
    ];

    mockPrisma = {
      member: {
        findFirst: jest.fn(async ({ where }) => {
          return dbMembers.find(
            (m) => (!where.id || m.id === where.id) && (!where.gymId || m.gymId === where.gymId),
          ) || null;
        }),
      },
      trainerAssignment: {
        findFirst: jest.fn(async ({ where }) => {
          return dbAssignments.find(
            (a) =>
              (!where.gymId || a.gymId === where.gymId) &&
              (!where.memberId || a.memberId === where.memberId) &&
              (!where.trainerId || a.trainerId === where.trainerId) &&
              (!('isActive' in where) || a.isActive === where.isActive),
          ) || null;
        }),
      },
      dietPlan: {
        findFirst: jest.fn(async ({ where }) => {
          const plan = dbDietPlans.find(
            (p) =>
              (!where.id || p.id === where.id) &&
              (!where.gymId || p.gymId === where.gymId) &&
              (!where.memberId || p.memberId === where.memberId) &&
              (!('isActive' in where) || p.isActive === where.isActive),
          );
          if (!plan) return null;
          return {
            ...plan,
            meals: dbDietMeals.filter((m) => m.dietPlanId === plan.id),
            member: dbMembers.find((m) => m.id === plan.memberId),
          };
        }),
        findUnique: jest.fn(async ({ where }) => {
          const plan = dbDietPlans.find((p) => p.id === where.id);
          if (!plan) return null;
          return {
            ...plan,
            meals: dbDietMeals.filter((m) => m.dietPlanId === plan.id),
            member: dbMembers.find((m) => m.id === plan.memberId),
          };
        }),
        findMany: jest.fn(async ({ where }) => {
          return dbDietPlans
            .filter(
              (p) =>
                (!where.gymId || p.gymId === where.gymId) &&
                (!where.memberId || p.memberId === where.memberId) &&
                (!('isActive' in where) || p.isActive === where.isActive),
            )
            .map((plan) => ({
              ...plan,
              meals: dbDietMeals.filter((m) => m.dietPlanId === plan.id),
            }));
        }),
        create: jest.fn(async ({ data }) => {
          const newPlan = {
            id: `plan-${dbDietPlans.length + 1}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dbDietPlans.push(newPlan);
          return newPlan;
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          let count = 0;
          for (const p of dbDietPlans) {
            if (
              (!where.gymId || p.gymId === where.gymId) &&
              (!where.memberId || p.memberId === where.memberId) &&
              (!where.id || (where.id.not && p.id !== where.id.not)) &&
              (!('isActive' in where) || p.isActive === where.isActive)
            ) {
              Object.assign(p, data);
              count++;
            }
          }
          return { count };
        }),
        update: jest.fn(async ({ where, data }) => {
          const plan = dbDietPlans.find((p) => p.id === where.id);
          if (plan) Object.assign(plan, data, { updatedAt: new Date() });
          return plan;
        }),
      },
      dietPlanMeal: {
        createMany: jest.fn(async ({ data }) => {
          for (const m of data) {
            dbDietMeals.push({ id: `meal-${dbDietMeals.length + 1}`, ...m });
          }
          return { count: data.length };
        }),
        deleteMany: jest.fn(async ({ where }) => {
          const initialLen = dbDietMeals.length;
          dbDietMeals = dbDietMeals.filter((m) => m.dietPlanId !== where.dietPlanId);
          return { count: initialLen - dbDietMeals.length };
        }),
      },
      dietPlanTemplate: {
        findFirst: jest.fn(async ({ where }) => {
          return dbTemplates.find((t) => (!where.id || t.id === where.id)) || null;
        }),
        findMany: jest.fn(async () => dbTemplates),
        create: jest.fn(async ({ data }) => {
          const newT = { id: `template-${dbTemplates.length + 1}`, ...data };
          dbTemplates.push(newT);
          return newT;
        }),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    mockMessagingService = {
      sendAutomatedTemplateMessage: jest.fn(async (params) => {
        dispatchedMessages.push(params);
        return { success: true, providerMessageId: 'SM_test_123' };
      }),
    };

    dietPlansService = new DietPlansService(mockPrisma, mockMessagingService);
  });

  describe('1. Trainer Scoping & Authorization', () => {
    const validPlanDto: CreateDietPlanDto = {
      memberId: MEMBER_A1_ID,
      title: 'Hypertrophy Phase 1',
      goal: 'MUSCLE_GAIN',
      notes: 'Drink 4L water daily',
      meals: [
        {
          mealType: 'BREAKFAST',
          description: '4 whole eggs, 2 slices oats bread',
          calories: 450,
          proteinG: 32,
          orderIndex: 0,
        },
      ],
    };

    it('Assigned trainer (Trainer 1) CAN create a diet plan for their member', async () => {
      const plan = await dietPlansService.createDietPlan(
        GYM_A_ID,
        TRAINER_1_ID,
        'TRAINER',
        validPlanDto,
      );

      expect(plan).toBeDefined();
      expect(plan.title).toBe('Hypertrophy Phase 1');
      expect(plan.isActive).toBe(true);
      expect(plan.meals.length).toBe(1);
    });

    it('Unassigned trainer (Trainer 2) CANNOT create a plan for Member A1 (403 Forbidden)', async () => {
      await expect(
        dietPlansService.createDietPlan(
          GYM_A_ID,
          TRAINER_2_ID,
          'TRAINER',
          validPlanDto,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('Gym Owner CAN create a plan for any member in their gym', async () => {
      const plan = await dietPlansService.createDietPlan(
        GYM_A_ID,
        OWNER_A_ID,
        'GYM_OWNER',
        validPlanDto,
      );

      expect(plan).toBeDefined();
      expect(plan.title).toBe('Hypertrophy Phase 1');
    });

    it('Cross-tenant safety: Cannot create plan for a member in another gym (404 Not Found)', async () => {
      await expect(
        dietPlansService.createDietPlan(GYM_A_ID, TRAINER_1_ID, 'TRAINER', {
          ...validPlanDto,
          memberId: MEMBER_B1_ID, // Member in Gym B
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('2. Diet Plan Versioning (Deactivate Previous Active Plan)', () => {
    it('Creating a new active plan automatically deactivates the previous one', async () => {
      // First plan
      const plan1 = await dietPlansService.createDietPlan(GYM_A_ID, TRAINER_1_ID, 'TRAINER', {
        memberId: MEMBER_A1_ID,
        title: 'Initial Cut Plan',
        goal: 'WEIGHT_LOSS',
        meals: [],
      });
      expect(plan1.isActive).toBe(true);

      // Second plan
      const plan2 = await dietPlansService.createDietPlan(GYM_A_ID, TRAINER_1_ID, 'TRAINER', {
        memberId: MEMBER_A1_ID,
        title: 'Updated Maintenance Plan',
        goal: 'MAINTENANCE',
        meals: [],
      });

      expect(plan2.isActive).toBe(true);

      // Verify plan 1 is now deactivated (isActive=false) in DB
      const previousPlanInDb = dbDietPlans.find((p) => p.id === plan1.id);
      expect(previousPlanInDb.isActive).toBe(false);

      // Both plans remain queryable in history
      const history = await dietPlansService.listMemberDietPlans(
        GYM_A_ID,
        MEMBER_A1_ID,
        TRAINER_1_ID,
        'TRAINER',
      );
      expect(history.length).toBe(2);
    });
  });

  describe('3. Template Cloning', () => {
    it('Cloning a template pre-fills meals and goal into a new active plan', async () => {
      const cloneDto: CloneTemplateDto = {
        templateId: 'template-weight-loss-1',
        memberId: MEMBER_A1_ID,
        customTitle: 'Ali Customized Weight Loss',
      };

      const clonedPlan = await dietPlansService.cloneFromTemplate(
        GYM_A_ID,
        TRAINER_1_ID,
        'TRAINER',
        cloneDto,
      );

      expect(clonedPlan).toBeDefined();
      expect(clonedPlan.title).toBe('Ali Customized Weight Loss');
      expect(clonedPlan.goal).toBe('WEIGHT_LOSS');
      expect(clonedPlan.meals.length).toBe(3);
      expect(clonedPlan.meals[0].mealType).toBe('BREAKFAST');
      expect(clonedPlan.meals[1].mealType).toBe('LUNCH');
      expect(clonedPlan.meals[2].mealType).toBe('DINNER');
    });
  });

  describe('4. WhatsApp Delivery via Existing MessagingProvider', () => {
    it('Dispatches structured WhatsApp notification on plan creation', async () => {
      await dietPlansService.createDietPlan(GYM_A_ID, TRAINER_1_ID, 'TRAINER', {
        memberId: MEMBER_A1_ID,
        title: 'Cutting Protocol',
        goal: 'WEIGHT_LOSS',
        meals: [
          {
            mealType: 'BREAKFAST',
            description: '3 egg whites, 1 apple',
            calories: 210,
            proteinG: 18,
            orderIndex: 0,
          },
        ],
        sendWhatsAppNotification: true,
      });

      expect(mockMessagingService.sendAutomatedTemplateMessage).toHaveBeenCalledTimes(1);
      const dispatched = dispatchedMessages[0];

      expect(dispatched.gymId).toBe(GYM_A_ID);
      expect(dispatched.memberId).toBe(MEMBER_A1_ID);
      expect(dispatched.templateName).toBe('diet_plan_assigned');
      expect(dispatched.category).toBe('UTILITY');
      expect(dispatched.parameters.planTitle).toBe('Cutting Protocol');
      expect(dispatched.parameters.mealsSummary).toContain('BREAKFAST');
      expect(dispatched.parameters.mealsSummary).toContain('3 egg whites');
    });
  });
});
