import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TrainersService } from '../src/modules/trainers/trainers.service';
import { MembersService } from '../src/modules/members/members.service';
import { TrainersController } from '../src/modules/trainers/trainers.controller';
import { JwtPayload } from '../src/common/interfaces/jwt-payload.interface';

describe('Trainer Assignment & Query-Scoping Test Suite', () => {
  const GYM_A_ID = '11111111-1111-1111-1111-111111111111';
  const GYM_B_ID = '22222222-2222-2222-2222-222222222222';

  const TRAINER_1_ID = 'trainer-1-uuid';
  const TRAINER_2_ID = 'trainer-2-uuid';
  const TRAINER_B_ID = 'trainer-b-uuid';

  const MEMBER_A1_ID = 'member-a1-uuid';
  const MEMBER_A2_ID = 'member-a2-uuid';
  const MEMBER_B1_ID = 'member-b1-uuid';

  let trainersService: TrainersService;
  let membersService: MembersService;
  let mockPrisma: any;

  // Mock in-memory DB collections
  let dbMembers: any[] = [];
  let dbStaff: any[] = [];
  let dbAssignments: any[] = [];

  beforeEach(() => {
    dbMembers = [
      {
        id: MEMBER_A1_ID,
        gymId: GYM_A_ID,
        firstName: 'Ali',
        lastName: 'Ahmed',
        memberCode: 'GR-1001',
        phone: '+923001111111',
        status: 'ACTIVE',
        streak: { currentStreak: 5, longestStreak: 10 },
        _count: { checkIns: 12 },
        dietPlans: [],
      },
      {
        id: MEMBER_A2_ID,
        gymId: GYM_A_ID,
        firstName: 'Bilal',
        lastName: 'Khan',
        memberCode: 'GR-1002',
        phone: '+923001111112',
        status: 'ACTIVE',
        streak: { currentStreak: 0, longestStreak: 2 },
        _count: { checkIns: 4 },
        dietPlans: [],
      },
      {
        id: MEMBER_B1_ID,
        gymId: GYM_B_ID,
        firstName: 'Zubair',
        lastName: 'Canary',
        memberCode: 'GR-2001',
        phone: '+923002222222',
        status: 'ACTIVE',
        streak: null,
        _count: { checkIns: 1 },
        dietPlans: [],
      },
    ];

    dbStaff = [
      {
        id: TRAINER_1_ID,
        gymId: GYM_A_ID,
        name: 'Coach Tariq',
        email: 'tariq@gyma.pk',
        phone: '+923003333331',
        role: 'TRAINER',
        isActive: true,
      },
      {
        id: TRAINER_2_ID,
        gymId: GYM_A_ID,
        name: 'Coach Sarah',
        email: 'sarah@gyma.pk',
        phone: '+923003333332',
        role: 'TRAINER',
        isActive: true,
      },
      {
        id: TRAINER_B_ID,
        gymId: GYM_B_ID,
        name: 'Coach Zubair',
        email: 'zubair@gymb.pk',
        phone: '+923004444441',
        role: 'TRAINER',
        isActive: true,
      },
    ];

    dbAssignments = [];

    mockPrisma = {
      member: {
        findFirst: jest.fn(async ({ where }) => {
          return dbMembers.find((m) => {
            const matchesId = !where.id || m.id === where.id;
            const matchesGym = !where.gymId || m.gymId === where.gymId;
            let matchesTrainer = true;
            if (where.trainerAssignments?.some) {
              const reqTrainerId = where.trainerAssignments.some.trainerId;
              const reqActive = where.trainerAssignments.some.isActive;
              matchesTrainer = dbAssignments.some(
                (a) => a.memberId === m.id && a.trainerId === reqTrainerId && a.isActive === reqActive,
              );
            }
            return matchesId && matchesGym && matchesTrainer;
          }) || null;
        }),
        findMany: jest.fn(async ({ where }) => {
          return dbMembers.filter((m) => {
            const matchesGym = !where.gymId || m.gymId === where.gymId;
            let matchesTrainer = true;
            if (where.trainerAssignments?.some) {
              const reqTrainerId = where.trainerAssignments.some.trainerId;
              const reqActive = where.trainerAssignments.some.isActive;
              matchesTrainer = dbAssignments.some(
                (a) => a.memberId === m.id && a.trainerId === reqTrainerId && a.isActive === reqActive,
              );
            }
            return matchesGym && matchesTrainer;
          });
        }),
        count: jest.fn(async ({ where }) => {
          return dbMembers.filter((m) => {
            const matchesGym = !where.gymId || m.gymId === where.gymId;
            let matchesTrainer = true;
            if (where.trainerAssignments?.some) {
              const reqTrainerId = where.trainerAssignments.some.trainerId;
              const reqActive = where.trainerAssignments.some.isActive;
              matchesTrainer = dbAssignments.some(
                (a) => a.memberId === m.id && a.trainerId === reqTrainerId && a.isActive === reqActive,
              );
            }
            return matchesGym && matchesTrainer;
          }).length;
        }),
      },
      gymStaff: {
        findFirst: jest.fn(async ({ where }) => {
          return dbStaff.find(
            (s) =>
              (!where.id || s.id === where.id) &&
              (!where.gymId || s.gymId === where.gymId) &&
              (!where.role || s.role === where.role) &&
              (!('isActive' in where) || s.isActive === where.isActive),
          ) || null;
        }),
        findMany: jest.fn(async ({ where }) => {
          return dbStaff
            .filter(
              (s) =>
                (!where.gymId || s.gymId === where.gymId) &&
                (!where.role || s.role === where.role) &&
                (!('isActive' in where) || s.isActive === where.isActive),
            )
            .map((s) => ({
              ...s,
              trainerAssignments: dbAssignments.filter(
                (a) => a.trainerId === s.id && a.isActive === true,
              ),
            }));
        }),
      },
      trainerAssignment: {
        findFirst: jest.fn(async ({ where }) => {
          return dbAssignments.find(
            (a) =>
              (!where.id || a.id === where.id) &&
              (!where.gymId || a.gymId === where.gymId) &&
              (!where.memberId || a.memberId === where.memberId) &&
              (!('isActive' in where) || a.isActive === where.isActive),
          ) || null;
        }),
        findMany: jest.fn(async ({ where }) => {
          return dbAssignments
            .filter(
              (a) =>
                (!where.gymId || a.gymId === where.gymId) &&
                (!where.trainerId || a.trainerId === where.trainerId) &&
                (!where.memberId || a.memberId === where.memberId) &&
                (!('isActive' in where) || a.isActive === where.isActive),
            )
            .map((a) => ({
              ...a,
              member: dbMembers.find((m) => m.id === a.memberId),
              trainer: dbStaff.find((s) => s.id === a.trainerId),
            }));
        }),
        create: jest.fn(async ({ data }) => {
          const newAssignment = {
            id: `assign-${dbAssignments.length + 1}`,
            gymId: data.gymId,
            memberId: data.memberId,
            trainerId: data.trainerId,
            assignedAt: new Date(),
            isActive: data.isActive ?? true,
          };
          dbAssignments.push(newAssignment);
          return {
            ...newAssignment,
            member: dbMembers.find((m) => m.id === data.memberId),
            trainer: dbStaff.find((s) => s.id === data.trainerId),
          };
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          let count = 0;
          for (const a of dbAssignments) {
            if (
              (!where.gymId || a.gymId === where.gymId) &&
              (!where.memberId || a.memberId === where.memberId) &&
              (!('isActive' in where) || a.isActive === where.isActive)
            ) {
              Object.assign(a, data);
              count++;
            }
          }
          return { count };
        }),
        update: jest.fn(async ({ where, data }) => {
          const a = dbAssignments.find((item) => item.id === where.id);
          if (a) Object.assign(a, data);
          return a;
        }),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(mockPrisma);
      }),
    };

    trainersService = new TrainersService(mockPrisma);
    membersService = new MembersService(mockPrisma, {} as any);
  });

  describe('1. Tenant Isolation & Cross-Tenant Assignment Prevention', () => {
    it('should REJECT assigning a Gym B member to a Gym A trainer (404 Not Found)', async () => {
      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: MEMBER_B1_ID, // Member in Gym B
          trainerId: TRAINER_1_ID, // Trainer in Gym A
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should REJECT assigning a Gym A member to a Gym B trainer (400 Bad Request)', async () => {
      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: MEMBER_A1_ID,
          trainerId: TRAINER_B_ID, // Trainer in Gym B!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully assign Gym A member to Gym A trainer', async () => {
      const assignment = await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      expect(assignment).toBeDefined();
      expect(assignment.isActive).toBe(true);
      expect(assignment.trainerId).toBe(TRAINER_1_ID);
      expect(assignment.memberId).toBe(MEMBER_A1_ID);
    });

    it('should PREVENT duplicate active assignment without reassigning (409 Conflict)', async () => {
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: MEMBER_A1_ID,
          trainerId: TRAINER_2_ID,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('2. Reassignment History Preservation', () => {
    it('should preserve previous assignment with isActive=false when reassigning', async () => {
      // First assignment
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      // Reassign to Trainer 2
      const reassignment = await trainersService.reassignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        newTrainerId: TRAINER_2_ID,
      });

      expect(reassignment).toBeDefined();
      expect(reassignment.trainerId).toBe(TRAINER_2_ID);
      expect(reassignment.isActive).toBe(true);

      // Verify full history is preserved
      const history = await trainersService.getMemberAssignments(GYM_A_ID, MEMBER_A1_ID);
      expect(history.length).toBe(2);

      const oldAssign = history.find((h) => h.trainerId === TRAINER_1_ID);
      const newAssign = history.find((h) => h.trainerId === TRAINER_2_ID);

      expect(oldAssign.isActive).toBe(false);
      expect(newAssign.isActive).toBe(true);
    });
  });

  describe('3. Query-Level Trainer Scoping', () => {
    beforeEach(async () => {
      // Assign Member A1 to Trainer 1
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });
      // Member A2 is left unassigned
    });

    it('Trainer sees ONLY their assigned member when listing members', async () => {
      // Owner/Manager query (no trainerId filter)
      const ownerView = await membersService.listMembers(GYM_A_ID, {});
      expect(ownerView.members.length).toBe(2);

      // Trainer 1 query (trainerId = TRAINER_1_ID)
      const trainer1View = await membersService.listMembers(GYM_A_ID, {
        trainerId: TRAINER_1_ID,
      });
      expect(trainer1View.members.length).toBe(1);
      expect(trainer1View.members[0].id).toBe(MEMBER_A1_ID);

      // Trainer 2 query (has 0 assigned members)
      const trainer2View = await membersService.listMembers(GYM_A_ID, {
        trainerId: TRAINER_2_ID,
      });
      expect(trainer2View.members.length).toBe(0);
    });

    it('Trainer attempting to view an unassigned member by ID gets 404', async () => {
      // Trainer 1 viewing their assigned member
      const member = await membersService.getMemberById(GYM_A_ID, MEMBER_A1_ID, TRAINER_1_ID);
      expect(member).toBeDefined();
      expect(member.id).toBe(MEMBER_A1_ID);

      // Trainer 1 attempting to view unassigned Member A2
      await expect(
        membersService.getMemberById(GYM_A_ID, MEMBER_A2_ID, TRAINER_1_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('Trainer cannot view other trainers assigned member roster in controller', async () => {
      const controller = new TrainersController(trainersService);

      const trainerUser: JwtPayload = {
        sub: TRAINER_1_ID,
        gymId: GYM_A_ID,
        email: 'tariq@gyma.pk',
        role: 'TRAINER',
        name: 'Coach Tariq',
      };

      // Allowed: view own members
      const myMembers = await controller.getMyAssignedMembers(GYM_A_ID, trainerUser);
      expect(myMembers.length).toBe(1);

      // Forbidden: view Trainer 2's members
      await expect(
        controller.getTrainerAssignedMembers(GYM_A_ID, TRAINER_2_ID, trainerUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
