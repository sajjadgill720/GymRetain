import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
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
    options?: { status?: string; search?: string; skip?: number; take?: number; trainerId?: string; unassigned?: boolean },
  ) {
    const { status, search, skip = 0, take = 50, trainerId, unassigned } = options || {};

    const where: any = {
      gymId,
      ...(status ? { status: status as any } : {}),
      ...(unassigned || trainerId === 'unassigned'
        ? {
            trainerAssignments: {
              none: {
                isActive: true,
              },
            },
          }
        : trainerId
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
   * Concurrency-safe memberCode generator with collision retry
   */
  private async generateUniqueMemberCode(tx: any, gymId: string): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await tx.member.count({ where: { gymId } });
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const candidate = `GR-${count + 1 + attempt * 10}-${randomSuffix}`;
      const existing = await tx.member.findFirst({
        where: { gymId, memberCode: candidate },
        select: { id: true },
      });
      if (!existing) {
        return candidate;
      }
    }
    // Fallback to random hex
    const { randomBytes } = await import('crypto');
    return `GR-${randomBytes(3).toString('hex').toUpperCase()}`;
  }

  /**
   * Create a new member scoped to gymId + auto-generate sequential memberCode + initialize streak
   */
  async createMember(gymId: string, dto: CreateMemberDto) {
    const { randomBytes } = await import('crypto');

    return this.tenantPrisma.runWithTenantRLS(gymId, async (tx) => {
      // Server-side usage limit check
      const gym = await tx.gym.findUnique({
        where: { id: gymId },
        select: { maxMembers: true, saasStatus: true },
      });
      if (gym && gym.maxMembers) {
        const activeMembersCount = await tx.member.count({
          where: { gymId, status: 'ACTIVE' },
        });
        if (activeMembersCount >= gym.maxMembers) {
          throw new ForbiddenException(
            `Plan member limit reached (${activeMembersCount}/${gym.maxMembers}). Upgrade your subscription tier to enroll more members.`,
          );
        }
      }

      // Check unique phone per gym
      const existingPhone = await tx.member.findFirst({
        where: { gymId, phone: dto.phone },
      });
      if (existingPhone) {
        throw new ConflictException(
          `Member with phone number ${dto.phone} already exists in this gym`,
        );
      }

      // Generate concurrency-safe unique member code
      const memberCode = await this.generateUniqueMemberCode(tx, gymId);

      // Generate individual opaque, cryptographically random QR credential
      const qrCredential = randomBytes(24).toString('base64url');

      // Create Member
      const member = await tx.member.create({
        data: {
          gymId,
          memberCode,
          qrCredential,
          qrCredentialIssuedAt: new Date(),
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
   * Lookup member for staff confirmation before check-in or checkout
   */
  async lookupMemberForCheckIn(gymId: string, identifierOrQr: string) {
    const trimmed = identifierOrQr.trim();
    const member = await this.prisma.member.findFirst({
      where: {
        gymId,
        OR: [
          { id: trimmed },
          { memberCode: trimmed },
          { phone: trimmed },
          { qrCredential: trimmed },
        ],
      },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
        },
        checkIns: {
          where: { sessionStatus: 'OPEN' },
          orderBy: { checkInTime: 'desc' },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`No member found matching identifier: "${trimmed}"`);
    }

    const openSession = member.checkIns[0] || null;

    return {
      member: {
        id: member.id,
        memberCode: member.memberCode,
        firstName: member.firstName,
        lastName: member.lastName,
        phone: member.phone,
        email: member.email,
        status: member.status,
        hasQrCredential: !!member.qrCredential && !member.qrCredentialRevokedAt,
      },
      activeMembership: member.memberships[0] || null,
      openSession: openSession
        ? {
            id: openSession.id,
            checkInTime: openSession.checkInTime,
            method: openSession.method,
            sessionStatus: openSession.sessionStatus,
          }
        : null,
      canCheckIn: member.status === 'ACTIVE' && !openSession,
      canCheckOut: !!openSession,
    };
  }

  /**
   * Get member QR code Data URL (rendered locally within application)
   */
  async getMemberQrCode(gymId: string, memberId: string) {
    const QRCode = await import('qrcode');
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    let credential = member.qrCredential;
    if (!credential || member.qrCredentialRevokedAt) {
      const { randomBytes } = await import('crypto');
      credential = randomBytes(24).toString('base64url');
      await this.prisma.member.update({
        where: { id: memberId },
        data: {
          qrCredential: credential,
          qrCredentialIssuedAt: new Date(),
          qrCredentialRevokedAt: null,
        },
      });
    }

    const qrDataUrl = await QRCode.toDataURL(credential, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });

    return {
      memberId: member.id,
      memberCode: member.memberCode,
      memberName: `${member.firstName} ${member.lastName}`,
      qrCredential: credential,
      qrDataUrl,
      issuedAt: member.qrCredentialIssuedAt || new Date(),
    };
  }

  /**
   * Issue or rotate individual member QR credential
   */
  async issueOrRotateQrCredential(
    gymId: string,
    memberId: string,
    staffId: string,
    actorRole: string,
  ) {
    const QRCode = await import('qrcode');
    const { randomBytes } = await import('crypto');

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const newCredential = randomBytes(24).toString('base64url');
    const updated = await this.prisma.member.update({
      where: { id: memberId },
      data: {
        qrCredential: newCredential,
        qrCredentialIssuedAt: new Date(),
        qrCredentialRevokedAt: null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId,
        actorRole,
        action: 'MEMBER_QR_CREDENTIAL_ROTATED',
        resource: 'MEMBER_CREDENTIAL',
        metadata: { memberId, memberCode: member.memberCode },
      },
    });

    const qrDataUrl = await QRCode.toDataURL(newCredential, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
    });

    return {
      success: true,
      message: 'New QR credential issued successfully. Any prior copied QR codes are now invalid.',
      memberId: updated.id,
      qrCredential: newCredential,
      qrDataUrl,
      issuedAt: updated.qrCredentialIssuedAt,
    };
  }

  /**
   * Revoke individual member QR credential
   */
  async revokeQrCredential(
    gymId: string,
    memberId: string,
    staffId: string,
    actorRole: string,
  ) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, gymId },
    });
    if (!member) {
      throw new NotFoundException('Member not found');
    }

    await this.prisma.member.update({
      where: { id: memberId },
      data: {
        qrCredential: null,
        qrCredentialRevokedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId,
        actorRole,
        action: 'MEMBER_QR_CREDENTIAL_REVOKED',
        resource: 'MEMBER_CREDENTIAL',
        metadata: { memberId, memberCode: member.memberCode },
      },
    });

    return {
      success: true,
      message: 'Member QR credential revoked. The member cannot use QR credentials until re-issued.',
      memberId,
    };
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
