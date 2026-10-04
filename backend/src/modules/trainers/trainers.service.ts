import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
import { RemoveTrainerDto } from './dto/remove-trainer.dto';
import { AssignTrainerDto } from './dto/assign-trainer.dto';
import { ReassignTrainerDto } from './dto/reassign-trainer.dto';
import { BulkAssignTrainerDto } from './dto/bulk-assign-trainer.dto';

@Injectable()
export class TrainersService {
  private readonly logger = new Logger(TrainersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all trainers in the gym with active member counts and search/filter support
   */
  async listTrainers(
    gymId: string,
    options?: {
      search?: string;
      status?: 'active' | 'inactive' | 'all';
      includeArchived?: boolean;
    },
  ) {
    const { search, status = 'all', includeArchived = false } = options || {};

    const where: any = {
      gymId,
      ...(includeArchived ? {} : { isArchived: false }),
    };

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
        { phone: { contains: term } },
      ];
    }

    const trainers = await this.prisma.trainer.findMany({
      where,
      include: {
        assignments: {
          where: { isActive: true },
          select: { id: true, memberId: true },
        },
      },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    return trainers.map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      specialties: t.specialties || [],
      photoUrl: t.photoUrl,
      bio: t.bio,
      isActive: t.isActive,
      isArchived: t.isArchived,
      staffId: t.staffId,
      assignedMembersCount: t.assignments.length,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  /**
   * Get a single trainer by ID
   */
  async getTrainer(gymId: string, id: string) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id, gymId },
      include: {
        assignments: {
          where: { isActive: true },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                memberCode: true,
                phone: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!trainer) {
      throw new NotFoundException('Trainer not found in this gym');
    }

    return {
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      specialties: trainer.specialties || [],
      photoUrl: trainer.photoUrl,
      bio: trainer.bio,
      isActive: trainer.isActive,
      isArchived: trainer.isArchived,
      staffId: trainer.staffId,
      assignedMembersCount: trainer.assignments.length,
      assignedMembers: trainer.assignments.map((a) => a.member),
      createdAt: trainer.createdAt,
      updatedAt: trainer.updatedAt,
    };
  }

  /**
   * Create a new trainer profile.
   * Trainer profiles are decoupled from staff login accounts; creating a trainer does not create login credentials.
   */
  async createTrainer(gymId: string, dto: CreateTrainerDto) {
    const trainer = await this.prisma.trainer.create({
      data: {
        gymId,
        name: dto.name.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        phone: dto.phone?.trim() || null,
        specialties: dto.specialties || [],
        photoUrl: dto.photoUrl || null,
        bio: dto.bio || null,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        isArchived: false,
      },
    });

    this.logger.log(`Created trainer profile ${trainer.name} (${trainer.id}) for gym ${gymId}`);
    return trainer;
  }

  /**
   * Update an existing trainer profile
   */
  async updateTrainer(gymId: string, id: string, dto: UpdateTrainerDto) {
    const existing = await this.prisma.trainer.findFirst({
      where: { id, gymId },
    });
    if (!existing) {
      throw new NotFoundException('Trainer not found in this gym');
    }

    const updated = await this.prisma.trainer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email ? dto.email.trim().toLowerCase() : null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone ? dto.phone.trim() : null } : {}),
        ...(dto.specialties !== undefined ? { specialties: dto.specialties } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl || null } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio || null } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    this.logger.log(`Updated trainer ${id} in gym ${gymId}`);
    return updated;
  }

  /**
   * Remove a trainer.
   * Checks for active assigned members:
   * - Allows reassigning members to another active trainer in the gym.
   * - Or allows leaving members unassigned.
   * Archives trainers who have historical records to maintain past attendance, notes, and assignments intact.
   */
  async removeTrainer(gymId: string, id: string, dto?: RemoveTrainerDto) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id, gymId },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found in this gym');
    }

    const assignments = await this.prisma.trainerAssignment.findMany({
      where: { trainerId: id, gymId },
    });
    const activeAssignments = assignments.filter((a) => a.isActive);

    // If there are active assignments, require explicit reassignment or unassign confirmation
    if (activeAssignments.length > 0) {
      if (dto?.reassignTrainerId) {
        if (dto.reassignTrainerId === id) {
          throw new BadRequestException('Target reassignment trainer must be a different trainer');
        }
        const targetTrainer = await this.prisma.trainer.findFirst({
          where: { id: dto.reassignTrainerId, gymId, isActive: true, isArchived: false },
        });
        if (!targetTrainer) {
          throw new BadRequestException('Target reassignment trainer not found or is inactive');
        }

        // Perform atomic reassignment of all active members
        await this.prisma.$transaction(async (tx) => {
          // Deactivate current assignments
          await tx.trainerAssignment.updateMany({
            where: { trainerId: id, isActive: true, gymId },
            data: { isActive: false },
          });

          // Create new assignments for target trainer
          for (const assignment of activeAssignments) {
            await tx.trainerAssignment.create({
              data: {
                gymId,
                memberId: assignment.memberId,
                trainerId: targetTrainer.id,
                isActive: true,
              },
            });
          }
        });
      } else if (dto?.unassignMembers) {
        // Deactivate all active assignments
        await this.prisma.trainerAssignment.updateMany({
          where: { trainerId: id, isActive: true, gymId },
          data: { isActive: false },
        });
      } else {
        throw new BadRequestException(
          `Trainer has ${activeAssignments.length} assigned member(s). Provide reassignTrainerId or confirm unassignMembers: true.`,
        );
      }
    }

    // Archive the trainer to preserve historical records
    const archived = await this.prisma.trainer.update({
      where: { id },
      data: {
        isActive: false,
        isArchived: true,
      },
    });

    this.logger.log(`Archived trainer ${trainer.name} (${id}) in gym ${gymId}`);
    return {
      success: true,
      id: archived.id,
      name: archived.name,
      isArchived: true,
      reassignedMembersCount: dto?.reassignTrainerId ? activeAssignments.length : 0,
      unassignedMembersCount: dto?.unassignMembers ? activeAssignments.length : 0,
    };
  }

  /**
   * Assign a member to a trainer (one primary coach per member).
   * Validates both belong to the same gym and trainer is active.
   * Atomically deactivates any existing active assignment and preserves history.
   */
  async assignTrainer(gymId: string, dto: AssignTrainerDto) {
    const member = await this.prisma.member.findFirst({
      where: { id: dto.memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this gym');
    }

    const trainer = await this.prisma.trainer.findFirst({
      where: { id: dto.trainerId, gymId, isActive: true, isArchived: false },
    });
    if (!trainer) {
      throw new BadRequestException('Trainer not found, inactive, or archived in this gym');
    }

    return this.prisma.$transaction(async (tx) => {
      // Check if already actively assigned to THIS trainer
      const existingSame = await tx.trainerAssignment.findFirst({
        where: { gymId, memberId: dto.memberId, trainerId: dto.trainerId, isActive: true },
      });
      if (existingSame) {
        return existingSame;
      }

      // Deactivate any previous active assignments for this member
      await tx.trainerAssignment.updateMany({
        where: { gymId, memberId: dto.memberId, isActive: true },
        data: { isActive: false },
      });

      // Create new assignment
      return tx.trainerAssignment.create({
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
              photoUrl: true,
            },
          },
        },
      });
    });
  }

  /**
   * Bulk assign multiple members to a trainer in an atomic transaction
   */
  async bulkAssignMembers(gymId: string, dto: BulkAssignTrainerDto) {
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: dto.trainerId, gymId, isActive: true, isArchived: false },
    });
    if (!trainer) {
      throw new BadRequestException('Target trainer not found or is inactive/archived');
    }

    // Verify all members belong to this gym
    const members = await this.prisma.member.findMany({
      where: {
        id: { in: dto.memberIds },
        gymId,
      },
      select: { id: true },
    });

    if (members.length !== dto.memberIds.length) {
      throw new BadRequestException('One or more selected members do not belong to this gym');
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Deactivate existing active assignments for these members
      await tx.trainerAssignment.updateMany({
        where: {
          gymId,
          memberId: { in: dto.memberIds },
          isActive: true,
        },
        data: { isActive: false },
      });

      // 2. Create new assignments for each member
      for (const memberId of dto.memberIds) {
        await tx.trainerAssignment.create({
          data: {
            gymId,
            memberId,
            trainerId: dto.trainerId,
            isActive: true,
          },
        });
      }
    });

    this.logger.log(
      `Bulk assigned ${dto.memberIds.length} members to trainer ${trainer.name} (${trainer.id}) in gym ${gymId}`,
    );

    return {
      success: true,
      trainerId: trainer.id,
      trainerName: trainer.name,
      assignedCount: dto.memberIds.length,
    };
  }

  /**
   * Reassign a member to a new trainer
   */
  async reassignTrainer(gymId: string, dto: ReassignTrainerDto) {
    return this.assignTrainer(gymId, {
      memberId: dto.memberId,
      trainerId: dto.newTrainerId,
    });
  }

  /**
   * Remove assignment for a member (leaving them unassigned)
   */
  async unassignMember(gymId: string, memberId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found in this gym');
    }

    const updated = await this.prisma.trainerAssignment.updateMany({
      where: { gymId, memberId, isActive: true },
      data: { isActive: false },
    });

    return {
      success: true,
      unassignedMemberId: memberId,
      modifiedCount: updated.count,
    };
  }

  /**
   * Deactivate a specific trainer assignment by assignment ID
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
    const trainer = await this.prisma.trainer.findFirst({
      where: { id: trainerId, gymId },
    });
    if (!trainer) {
      throw new NotFoundException('Trainer not found in this gym');
    }

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
   * Get unassigned members who do not currently have an active trainer
   */
  async getUnassignedMembers(gymId: string) {
    const members = await this.prisma.member.findMany({
      where: {
        gymId,
        status: 'ACTIVE',
        trainerAssignments: {
          none: {
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        memberCode: true,
        phone: true,
        email: true,
        status: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    });

    return members;
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
            photoUrl: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
