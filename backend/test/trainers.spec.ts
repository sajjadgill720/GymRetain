import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TrainersService } from '../src/modules/trainers/trainers.service';
import { MembersService } from '../src/modules/members/members.service';
import { TrainersController } from '../src/modules/trainers/trainers.controller';
import { JwtPayload } from '../src/common/interfaces/jwt-payload.interface';

describe('Trainer Management & Member Assignment Test Suite', () => {
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
  let dbTrainers: any[] = [];
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

    dbTrainers = [
      {
        id: TRAINER_1_ID,
        gymId: GYM_A_ID,
        name: 'Coach Tariq',
        email: 'tariq@gyma.pk',
        phone: '+923003333331',
        specialties: ['Hypertrophy', 'Strength'],
        photoUrl: null,
        bio: 'Senior trainer with 10 years experience',
        isActive: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: TRAINER_2_ID,
        gymId: GYM_A_ID,
        name: 'Coach Sarah',
        email: 'sarah@gyma.pk',
        phone: '+923003333332',
        specialties: ['HIIT', 'Fat Loss'],
        photoUrl: null,
        bio: 'Specialist in conditioning',
        isActive: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: TRAINER_B_ID,
        gymId: GYM_B_ID,
        name: 'Coach Zubair',
        email: 'zubair@gymb.pk',
        phone: '+923004444441',
        specialties: ['Powerlifting'],
        photoUrl: null,
        bio: 'Gym B Head Trainer',
        isActive: true,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
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
            const matchesStatus = !where.status || m.status === where.status;
            let matchesTrainer = true;
            if (where.trainerAssignments?.some) {
              const reqTrainerId = where.trainerAssignments.some.trainerId;
              const reqActive = where.trainerAssignments.some.isActive;
              matchesTrainer = dbAssignments.some(
                (a) => a.memberId === m.id && a.trainerId === reqTrainerId && a.isActive === reqActive,
              );
            } else if (where.trainerAssignments?.none) {
              matchesTrainer = !dbAssignments.some((a) => a.memberId === m.id && a.isActive === true);
            }
            return matchesGym && matchesStatus && matchesTrainer;
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
      trainer: {
        findFirst: jest.fn(async ({ where }) => {
          return dbTrainers.find(
            (t) =>
              (!where.id || t.id === where.id) &&
              (!where.gymId || t.gymId === where.gymId) &&
              (!('isActive' in where) || t.isActive === where.isActive) &&
              (!('isArchived' in where) || t.isArchived === where.isArchived),
          ) || null;
        }),
        findMany: jest.fn(async ({ where }) => {
          return dbTrainers
            .filter(
              (t) =>
                (!where.gymId || t.gymId === where.gymId) &&
                (!('isActive' in where) || t.isActive === where.isActive) &&
                (!('isArchived' in where) || t.isArchived === where.isArchived),
            )
            .map((t) => ({
              ...t,
              assignments: dbAssignments.filter(
                (a) => a.trainerId === t.id && a.isActive === true,
              ),
            }));
        }),
        create: jest.fn(async ({ data }) => {
          const newTrainer = {
            id: `trainer-${dbTrainers.length + 1}`,
            gymId: data.gymId,
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            specialties: data.specialties || [],
            photoUrl: data.photoUrl || null,
            bio: data.bio || null,
            isActive: data.isActive !== undefined ? data.isActive : true,
            isArchived: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          dbTrainers.push(newTrainer);
          return newTrainer;
        }),
        update: jest.fn(async ({ where, data }) => {
          const t = dbTrainers.find((item) => item.id === where.id);
          if (t) Object.assign(t, data);
          return t;
        }),
      },
      trainerAssignment: {
        findFirst: jest.fn(async ({ where }) => {
          return dbAssignments.find(
            (a) =>
              (!where.id || a.id === where.id) &&
              (!where.gymId || a.gymId === where.gymId) &&
              (!where.memberId || a.memberId === where.memberId) &&
              (!where.trainerId || a.trainerId === where.trainerId) &&
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
              trainer: dbTrainers.find((t) => t.id === a.trainerId),
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
            trainer: dbTrainers.find((t) => t.id === data.trainerId),
          };
        }),
        updateMany: jest.fn(async ({ where, data }) => {
          let count = 0;
          for (const a of dbAssignments) {
            const matchesGym = !where.gymId || a.gymId === where.gymId;
            const matchesTrainer = !where.trainerId || a.trainerId === where.trainerId;
            const matchesMember =
              !where.memberId ||
              (where.memberId.in ? where.memberId.in.includes(a.memberId) : a.memberId === where.memberId);
            const matchesActive = !('isActive' in where) || a.isActive === where.isActive;

            if (matchesGym && matchesTrainer && matchesMember && matchesActive) {
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

  describe('1. Trainer Profile CRUD & Separation from Staff Accounts', () => {
    it('creates a new trainer without creating login account credentials', async () => {
      const created = await trainersService.createTrainer(GYM_A_ID, {
        name: 'Coach Usman',
        email: 'usman@gym.pk',
        phone: '+923007777777',
        specialties: ['Olympic Weightlifting', 'Mobility'],
        isActive: true,
      });

      expect(created).toBeDefined();
      expect(created.name).toBe('Coach Usman');
      expect(created.specialties).toContain('Olympic Weightlifting');
      expect(created.isArchived).toBe(false);
      expect((created as any).passwordHash).toBeUndefined(); // Decoupled from staff login
    });

    it('updates trainer profile fields successfully', async () => {
      const updated = await trainersService.updateTrainer(GYM_A_ID, TRAINER_1_ID, {
        name: 'Coach Tariq Senior',
        specialties: ['Advanced Hypertrophy'],
      });

      expect(updated.name).toBe('Coach Tariq Senior');
      expect(updated.specialties).toEqual(['Advanced Hypertrophy']);
    });
  });

  describe('2. Member Assignment & Cross-Tenant Isolation', () => {
    it('rejects assigning Gym B member to Gym A trainer (NotFoundException)', async () => {
      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: MEMBER_B1_ID, // Member in Gym B
          trainerId: TRAINER_1_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects assigning Gym A member to Gym B trainer (BadRequestException)', async () => {
      await expect(
        trainersService.assignTrainer(GYM_A_ID, {
          memberId: MEMBER_A1_ID,
          trainerId: TRAINER_B_ID, // Trainer in Gym B!
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('successfully assigns member to trainer and atomically replaces previous assignment', async () => {
      const assign1 = await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });
      expect(assign1.isActive).toBe(true);
      expect(assign1.trainerId).toBe(TRAINER_1_ID);

      // Reassign to Trainer 2 atomically
      const assign2 = await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_2_ID,
      });
      expect(assign2.isActive).toBe(true);
      expect(assign2.trainerId).toBe(TRAINER_2_ID);

      // Verify previous assignment is now inactive
      const history = await trainersService.getMemberAssignments(GYM_A_ID, MEMBER_A1_ID);
      expect(history.length).toBe(2);
      const oldA = history.find((h) => h.trainerId === TRAINER_1_ID);
      const newA = history.find((h) => h.trainerId === TRAINER_2_ID);
      expect(oldA.isActive).toBe(false);
      expect(newA.isActive).toBe(true);
    });

    it('supports bulk assigning multiple members to a trainer in an atomic transaction', async () => {
      const result = await trainersService.bulkAssignMembers(GYM_A_ID, {
        trainerId: TRAINER_1_ID,
        memberIds: [MEMBER_A1_ID, MEMBER_A2_ID],
      });

      expect(result.success).toBe(true);
      expect(result.assignedCount).toBe(2);
      expect(result.trainerId).toBe(TRAINER_1_ID);

      const trainer1Members = await trainersService.getAssignedMembers(GYM_A_ID, TRAINER_1_ID);
      expect(trainer1Members.length).toBe(2);
    });

    it('allows unassigning a member leaving them without an active coach', async () => {
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      const unassign = await trainersService.unassignMember(GYM_A_ID, MEMBER_A1_ID);
      expect(unassign.success).toBe(true);

      const activeHistory = (await trainersService.getMemberAssignments(GYM_A_ID, MEMBER_A1_ID)).filter(
        (a) => a.isActive,
      );
      expect(activeHistory.length).toBe(0);
    });
  });

  describe('3. Removing Trainer with Reassignment / Unassignment & Archiving', () => {
    it('requires reassignment or unassignment confirmation when removing trainer with active members', async () => {
      // Assign Member A1 to Trainer 1
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      // Attempt removal without specifying option -> throws BadRequestException
      await expect(trainersService.removeTrainer(GYM_A_ID, TRAINER_1_ID)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('removes trainer and reassigns their active members to another active coach', async () => {
      // Assign Member A1 to Trainer 1
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      // Remove Trainer 1 with reassignTrainerId = TRAINER_2_ID
      const result = await trainersService.removeTrainer(GYM_A_ID, TRAINER_1_ID, {
        reassignTrainerId: TRAINER_2_ID,
      });

      expect(result.success).toBe(true);
      expect(result.isArchived).toBe(true);
      expect(result.reassignedMembersCount).toBe(1);

      // Verify Trainer 1 is archived
      const archivedTrainer = dbTrainers.find((t) => t.id === TRAINER_1_ID);
      expect(archivedTrainer.isActive).toBe(false);
      expect(archivedTrainer.isArchived).toBe(true);

      // Verify Member A1 is now actively assigned to Trainer 2
      const t2Members = await trainersService.getAssignedMembers(GYM_A_ID, TRAINER_2_ID);
      expect(t2Members.length).toBe(1);
      expect(t2Members[0].member.id).toBe(MEMBER_A1_ID);
    });

    it('removes trainer and unassigns members when unassignMembers is confirmed', async () => {
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });

      const result = await trainersService.removeTrainer(GYM_A_ID, TRAINER_1_ID, {
        unassignMembers: true,
      });

      expect(result.success).toBe(true);
      expect(result.unassignedMembersCount).toBe(1);

      const unassignedList = await trainersService.getUnassignedMembers(GYM_A_ID);
      expect(unassignedList.some((m) => m.id === MEMBER_A1_ID)).toBe(true);
    });
  });

  describe('4. Trainer Permission Scoping & Unassigned Filters', () => {
    beforeEach(async () => {
      await trainersService.assignTrainer(GYM_A_ID, {
        memberId: MEMBER_A1_ID,
        trainerId: TRAINER_1_ID,
      });
    });

    it('Trainer sees ONLY their assigned member when listing members', async () => {
      const trainer1View = await membersService.listMembers(GYM_A_ID, {
        trainerId: TRAINER_1_ID,
      });
      expect(trainer1View.members.length).toBe(1);
      expect(trainer1View.members[0].id).toBe(MEMBER_A1_ID);
    });

    it('filters unassigned members accurately', async () => {
      const unassigned = await membersService.listMembers(GYM_A_ID, {
        unassigned: true,
      });
      expect(unassigned.members.length).toBe(1);
      expect(unassigned.members[0].id).toBe(MEMBER_A2_ID);
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
