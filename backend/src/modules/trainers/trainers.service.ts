import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignTrainerDto } from './dto/assign-trainer.dto';
import { ReassignTrainerDto } from './dto/reassign-trainer.dto';

@Injectable()
export class TrainersService {
  private readonly logger = new Logger(TrainersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all trainers in the tenant gym with count of actively assigned members
   */
  async listTrainers(gymId: string) {
    const trainers = await this.prisma.gymStaff.findMany({
      where: {
        gymId,
        role: 'TRAINER',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        trainerAssignments: {
          where: { isActive: true },
          select: { id: true, memberId: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return trainers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      role: t.role,
      isActive: t.isActive,
      assignedMembersCount: t.trainerAssignments.length,
      createdAt: t.createdAt,
    }));
  }

  /**
   * Assign a trainer to a member (Owner/Manager only)
   */
  async assignTrainer(gymId: string, dto: AssignTrainerDto) {
    // 1. Verify member belongs to this gym
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this gym');
    }

    // 2. Verify trainer belongs to this gym and is a trainer
    const trainer = await this.prisma.gymStaff.findFirst({
      where: { id: dto.trainerId, gymId, role: 'TRAINER', isActive: true },
    });
    if (!trainer) {
      throw new BadRequestException('Trainer not found or inactive in this gym');
    }

    // 3. Check for existing active assignment
    const existing = await this.prisma.trainerAssignment.findFirst({
      where: {
        gymId,
        memberId: dto.memberId,
        isActive: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Member already has an active trainer assigned. Use reassign instead.',
      );
    }

    // 4. Create new assignment
    const assignment = await this.prisma.trainerAssignment.create({
      data: {
        gymId,
        memberId: dto.memberId,
        trainerId: dto.trainerId,
        isActive: true,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            memberCode: true,
            phone: true,
          },
        },
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(
      `Assigned trainer ${trainer.name} (${trainer.id}) to member ${member.firstName} ${member.lastName} in gym ${gymId}`,
    );

    return assignment;
  }

  /**
   * Reassign a member to a new trainer (preserves history with isActive=false)
   */
  async reassignTrainer(gymId: string, dto: ReassignTrainerDto) {
    // 1. Verify member belongs to gym
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this gym');
    }

    // 2. Verify new trainer
    const newTrainer = await this.prisma.gymStaff.findFirst({
      where: { id: dto.newTrainerId, gymId, role: 'TRAINER', isActive: true },
    });
    if (!newTrainer) {
      throw new BadRequestException('New trainer not found or inactive in this gym');
    }

    // 3. Atomically deactivate prior assignments and create new assignment
    return this.prisma.$transaction(async (tx) => {
      await tx.trainerAssignment.updateMany({
        where: {
          gymId,
          memberId: dto.memberId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      return tx.trainerAssignment.create({
        data: {
          gymId,
          memberId: dto.memberId,
          trainerId: dto.newTrainerId,
          isActive: true,
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberCode: true,
            },
          },
          trainer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });
  }

  /**
   * Deactivate a trainer assignment
   */
  async deactivateAssignment(gymId: string, assignmentId: string) {
    const assignment = await this.prisma.trainerAssignment.findFirst({
      where: { id: assignmentId, gymId },
    });
    if (!assignment) {
      throw new NotFoundException('Trainer assignment not found');
    }

    return this.prisma.trainerAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false },
    });
  }

  /**
   * Get all members actively assigned to a specific trainer
   */
  async getAssignedMembers(gymId: string, trainerId: string) {
    const assignments = await this.prisma.trainerAssignment.findMany({
      where: {
        gymId,
        trainerId,
        isActive: true,
      },
      include: {
        member: {
          include: {
            streak: true,
            dietPlans: {
              where: { isActive: true },
              take: 1,
              include: {
                meals: {
                  orderBy: { orderIndex: 'asc' },
                },
              },
            },
            _count: {
              select: { checkIns: true },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return assignments.map((a) => {
      const activePlan = a.member.dietPlans?.[0] || null;
      return {
        assignmentId: a.id,
        assignedAt: a.assignedAt,
        member: {
          id: a.member.id,
          firstName: a.member.firstName,
          lastName: a.member.lastName,
          memberCode: a.member.memberCode,
          phone: a.member.phone,
          status: a.member.status,
          currentStreak: a.member.streak?.currentStreak || 0,
          longestStreak: a.member.streak?.longestStreak || 0,
          totalCheckIns: a.member._count.checkIns,
        },
        dietPlan: activePlan
          ? {
              id: activePlan.id,
              title: activePlan.title,
              goal: activePlan.goal,
              customGoal: activePlan.customGoal,
              mealsCount: activePlan.meals.length,
              updatedAt: activePlan.updatedAt,
              status: 'ACTIVE_PLAN',
            }
          : {
              id: null,
              title: null,
              goal: null,
              customGoal: null,
              mealsCount: 0,
              updatedAt: null,
              status: 'NO_PLAN',
            },
      };
    });
  }

  /**
   * Get assignment history for a member
   */
  async getMemberAssignments(gymId: string, memberId: string) {
    return this.prisma.trainerAssignment.findMany({
      where: { gymId, memberId },
      include: {
        trainer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
