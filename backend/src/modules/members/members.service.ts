import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { addDays, addMonths } from 'date-fns';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantPrisma: TenantPrismaService,
  ) {}

  /**
   * List members for the tenant with optional status filtering and pagination
   */
  async listMembers(
    gymId: string,
    options?: { status?: string; search?: string; skip?: number; take?: number; trainerId?: string },
  ) {
    const { status, search, skip = 0, take = 50, trainerId } = options || {};

    const where: any = {
      gymId,
      ...(status ? { status: status as any } : {}),
      ...(trainerId
        ? {
            trainerAssignments: {
              some: {
                trainerId,
                isActive: true,
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { memberCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [members, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: {
          streak: true,
          memberships: {
            where: { status: 'ACTIVE' },
            orderBy: { endDate: 'desc' },
            take: 1,
          },
          trainerAssignments: {
            where: { isActive: true },
            include: {
              trainer: {
                select: { id: true, name: true, email: true },
              },
            },
            take: 1,
          },
          dietPlans: {
            where: { isActive: true },
            take: 1,
          },
          _count: {
            select: { checkIns: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.member.count({ where }),
    ]);

    return {
      members,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  /**
   * Get single member details by ID, strictly scoped to gymId and optional trainerId
   */
  async getMemberById(gymId: string, memberId: string, trainerId?: string) {
    const where: any = {
      id: memberId,
      gymId,
      ...(trainerId
        ? {
            trainerAssignments: {
              some: {
                trainerId,
                isActive: true,
              },
            },
          }
        : {}),
    };

    const member = await this.prisma.member.findFirst({
      where,
      include: {
        streak: true,
        memberships: { orderBy: { createdAt: 'desc' } },
        checkIns: { orderBy: { checkInTime: 'desc' }, take: 10 },
        rewardRedemptions: { include: { reward: true } },
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        trainerAssignments: {
          where: { isActive: true },
          include: {
            trainer: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        dietPlans: {
          where: { isActive: true },
          include: {
            meals: {
              orderBy: { orderIndex: 'asc' },
            },
          },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  /**
   * Create a new member scoped to gymId + auto-generate sequential memberCode + initialize streak
   */
  async createMember(gymId: string, dto: CreateMemberDto) {
    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // Generate human-friendly member code: e.g. "GR-1001"
      const count = await tx.member.count({ where: { gymId } });
      const memberCode = `GR-${(1001 + count).toString()}`;

      // Check unique phone per gym
      const existingPhone = await tx.member.findFirst({
        where: { gymId, phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          `Member with phone number ${dto.phone} already exists in this gym`,
        );
      }

      // Create Member
      const member = await tx.member.create({
        data: {
          gymId,
          memberCode,
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          email: dto.email,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          emergencyContact: dto.emergencyContact,
          notes: dto.notes,
          status: 'ACTIVE',
        },
      });

      // Initialize Streak tracking record for member
      await tx.streak.create({
        data: {
          gymId,
          memberId: member.id,
          currentStreak: 0,
          longestStreak: 0,
        },
      });

      // If initial membership details were supplied, create initial membership
      if (dto.planName && dto.planPricePaisa !== undefined) {
        const startDate = new Date();
        const endDate =
          dto.planType === 'QUARTERLY'
            ? addMonths(startDate, 3)
            : dto.planType === 'ANNUAL'
            ? addMonths(startDate, 12)
            : addMonths(startDate, 1);

        await tx.membership.create({
          data: {
            gymId,
            memberId: member.id,
            planName: dto.planName,
            planType: dto.planType || 'MONTHLY',
            price: dto.planPricePaisa,
            currency: 'PKR',
            startDate,
            endDate,
            status: 'ACTIVE',
          },
        });
      }

      return member;
    });
  }

  /**
   * Update member details
   */
  async updateMember(gymId: string, memberId: string, dto: UpdateMemberDto) {
    const existing = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  /**
   * Deactivate member (status = INACTIVE)
   */
  async deactivateMember(gymId: string, memberId: string) {
    const existing = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!existing) {
      throw new NotFoundException('Member not found');
    }

    return this.prisma.member.update({
      where: { id: memberId },
      data: { status: 'INACTIVE' },
    });
  }
}
