import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnerSignupDto } from './dto/owner-signup.dto';
import { LoginDto } from './dto/login.dto';
import { InviteStaffDto } from './dto/invite-staff.dto';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Phase 1: Gym Owner signs up and automatically bootstraps the Gym record.
   */
  async signupOwner(dto: OwnerSignupDto) {
    const existingStaff = await this.prisma.gymStaff.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingStaff) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingSlug = await this.prisma.gym.findUnique({
      where: { slug: dto.gymSlug.toLowerCase() },
    });
    if (existingSlug) {
      throw new ConflictException('This gym slug / URL identifier is already taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create Gym and Gym Owner in atomic transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const gym = await tx.gym.create({
        data: {
          name: dto.gymName,
          slug: dto.gymSlug.toLowerCase(),
          phone: dto.phone,
          address: dto.gymAddress,
          currency: 'PKR',
          status: 'ACTIVE',
          capacity: 100,
          capacityPolicy: 'WARNING_ONLY',
          saasPlan: 'TRIAL',
          saasStatus: 'TRIALING',
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          maxMembers: 50,
          maxStaff: 5,
        },
      });

      const staff = await tx.gymStaff.create({
        data: {
          gymId: gym.id,
          email: dto.email.toLowerCase(),
          passwordHash,
          name: dto.name,
          phone: dto.phone,
          role: 'GYM_OWNER',
        },
      });

      return { gym, staff };
    });


    const token = this.generateToken(result.staff);

    return {
      token,
      user: {
        id: result.staff.id,
        email: result.staff.email,
        name: result.staff.name,
        role: result.staff.role,
        gymId: result.gym.id,
        gymName: result.gym.name,
        gymSlug: result.gym.slug,
      },
    };
  }

  /**
   * User login (Owner, Staff, or Super Admin)
   * Resolves gym(s) strictly server-side from active gym_staff records.
   */
  async login(dto: LoginDto) {
    const staffRecords = await this.prisma.gymStaff.findMany({
      where: { email: dto.email.toLowerCase(), isActive: true },
      include: { gym: true },
      orderBy: { lastLoginAt: 'desc' },
    });

    if (!staffRecords || staffRecords.length === 0) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, staffRecords[0].passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Default to the most recently logged in gym staff record, or first record
    const activeStaff = staffRecords[0];

    await this.prisma.gymStaff.update({
      where: { id: activeStaff.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(activeStaff);

    // List of ONLY gyms this user is a verified staff member of
    const authorizedGyms = staffRecords
      .filter((s) => s.gym !== null && s.gym.status === 'ACTIVE')
      .map((s) => ({
        id: s.gym!.id,
        name: s.gym!.name,
        slug: s.gym!.slug,
        city: s.gym!.address || '',
        currency: s.gym!.currency,
        timezone: s.gym!.timezone,
        status: s.gym!.status,
        role: s.role,
      }));

    return {
      token,
      user: {
        id: activeStaff.id,
        email: activeStaff.email,
        name: activeStaff.name,
        role: activeStaff.role,
        gymId: activeStaff.gymId,
        gymName: activeStaff.gym?.name ?? null,
        gymSlug: activeStaff.gym?.slug ?? null,
      },
      activeGym: activeStaff.gym
        ? {
            id: activeStaff.gym.id,
            name: activeStaff.gym.name,
            slug: activeStaff.gym.slug,
            city: activeStaff.gym.address || '',
            currency: activeStaff.gym.currency,
            timezone: activeStaff.gym.timezone,
            status: activeStaff.gym.status,
          }
        : null,
      gyms: authorizedGyms,
    };
  }

  /**
   * Gym Owner invites a new staff member to their gym
   * Enforces staff quota limits and creates a persistent invitation record
   */
  async inviteStaff(gymId: string, dto: InviteStaffDto, invitedById?: string) {
    const gym = await this.prisma.gym.findUnique({
      where: { id: gymId },
      select: { maxStaff: true },
    });

    if (gym && gym.maxStaff) {
      const activeStaffCount = await this.prisma.gymStaff.count({
        where: { gymId, isActive: true },
      });
      if (activeStaffCount >= gym.maxStaff) {
        throw new ForbiddenException(
          `Staff limit reached (${activeStaffCount}/${gym.maxStaff}). Upgrade your subscription tier to invite more team members.`,
        );
      }
    }

    const existing = await this.prisma.gymStaff.findFirst({
      where: { email: dto.email.toLowerCase(), gymId },
    });
    if (existing) {
      throw new ConflictException('A staff member with this email already exists in this gym');
    }

    const { randomBytes } = await import('crypto');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store formal invitation
    const ownerStaff = await this.prisma.gymStaff.findFirst({ where: { gymId, role: 'GYM_OWNER' } });
    const inviterId = invitedById || ownerStaff?.id || gymId;

    const invitation = await this.prisma.staffInvitation.create({
      data: {
        gymId,
        email: dto.email.toLowerCase(),
        role: dto.role,
        name: dto.name,
        token,
        invitedById: inviterId,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Support instant credentials for backwards compatibility & automated tests
    const defaultPassword = 'GymRetain2026!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const staff = await this.prisma.gymStaff.create({
      data: {
        gymId,
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: dto.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        gymId: true,
        createdAt: true,
      },
    });

    return {
      staff,
      invitationId: invitation.id,
      invitationToken: token,
      invitationExpiresAt: expiresAt,
      temporaryPassword: defaultPassword,
      message: 'Staff member invited successfully with secure invitation token and temporary credentials.',
    };
  }

  async listStaff(gymId: string) {
    return this.prisma.gymStaff.findMany({
      where: { gymId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listInvitations(gymId: string) {
    return this.prisma.staffInvitation.findMany({
      where: { gymId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revokeInvitation(gymId: string, invitationId: string, actorStaffId?: string, actorRole: string = 'GYM_OWNER') {
    const inv = await this.prisma.staffInvitation.findFirst({
      where: { id: invitationId, gymId },
    });
    if (!inv) throw new NotFoundException('Invitation not found');

    const updated = await this.prisma.staffInvitation.update({
      where: { id: invitationId },
      data: { status: 'REVOKED' },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId: actorStaffId || null,
        actorRole,
        action: 'STAFF_INVITATION_REVOKED',
        resource: 'STAFF_INVITATION',
        metadata: { invitationId, email: inv.email },
      },
    });

    return { success: true, message: 'Invitation revoked', invitation: updated };
  }

  async updateStaffRole(gymId: string, targetStaffId: string, newRole: any, actorStaffId?: string, actorRole: string = 'GYM_OWNER') {
    const staff = await this.prisma.gymStaff.findFirst({
      where: { id: targetStaffId, gymId },
    });
    if (!staff) throw new NotFoundException('Staff member not found');

    const previousRole = staff.role;
    const updated = await this.prisma.gymStaff.update({
      where: { id: targetStaffId },
      data: { role: newRole },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });

    await this.prisma.auditLog.create({
      data: {
        gymId,
        staffId: actorStaffId || null,
        actorRole,
        action: 'STAFF_ROLE_CHANGED',
        resource: 'GYM_STAFF',
        metadata: { targetStaffId, previousRole, newRole },
      },
    });

    return { success: true, staff: updated };
  }


  /**
   * Returns the authenticated user's profile and their gym details.
   * Gym list is strictly scoped by querying all active staff records for this user's email.
   * Gracefully handles accounts with no gym assigned (returns gyms: [] and activeGym: null).
   */
  async getMe(jwtUser: JwtPayload) {
    const staff = await this.prisma.gymStaff.findUnique({
      where: { id: jwtUser.sub },
      include: { gym: true },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    // Find ALL active staff memberships for this user's verified email
    const allStaffRecords = await this.prisma.gymStaff.findMany({
      where: { email: staff.email.toLowerCase(), isActive: true },
      include: { gym: true },
    });

    const authorizedGyms = allStaffRecords
      .filter((s) => s.gym !== null && s.gym.status === 'ACTIVE')
      .map((s) => ({
        id: s.gym!.id,
        name: s.gym!.name,
        slug: s.gym!.slug,
        city: s.gym!.address || '',
        currency: s.gym!.currency,
        timezone: s.gym!.timezone,
        status: s.gym!.status,
        role: s.role,
      }));

    return {
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
        gymId: staff.gymId,
        gymName: staff.gym?.name ?? null,
        gymSlug: staff.gym?.slug ?? null,
      },
      activeGym: staff.gym
        ? {
            id: staff.gym.id,
            name: staff.gym.name,
            slug: staff.gym.slug,
            city: staff.gym.address || '',
            currency: staff.gym.currency,
            timezone: staff.gym.timezone,
            status: staff.gym.status,
          }
        : null,
      gyms: authorizedGyms,
    };
  }

  /**
   * Switches the active gym context for a multi-gym user.
   * Authenticates that the user has an active gym_staff record at targetGymId,
   * updates lastLoginAt, and signs a NEW JWT token with gymId = targetGymId.
   */
  async switchGym(jwtUser: JwtPayload, targetGymId: string) {
    if (!targetGymId) {
      throw new BadRequestException('Target gymId is required');
    }

    const currentStaff = await this.prisma.gymStaff.findUnique({
      where: { id: jwtUser.sub },
    });

    if (!currentStaff || !currentStaff.isActive) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    // Verify user actually has an active staff record at the target gym
    const targetStaff = await this.prisma.gymStaff.findFirst({
      where: {
        email: currentStaff.email.toLowerCase(),
        gymId: targetGymId,
        isActive: true,
      },
      include: { gym: true },
    });

    if (!targetStaff || !targetStaff.gym) {
      throw new ForbiddenException(
        'Tenant access denied: You are not an authorized staff member of the requested gym',
      );
    }

    await this.prisma.gymStaff.update({
      where: { id: targetStaff.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(targetStaff);

    return {
      token,
      activeGym: {
        id: targetStaff.gym.id,
        name: targetStaff.gym.name,
        slug: targetStaff.gym.slug,
        city: targetStaff.gym.address || '',
        currency: targetStaff.gym.currency,
        timezone: targetStaff.gym.timezone,
        status: targetStaff.gym.status,
      },
      user: {
        id: targetStaff.id,
        email: targetStaff.email,
        name: targetStaff.name,
        role: targetStaff.role,
        gymId: targetStaff.gymId,
        gymName: targetStaff.gym.name,
        gymSlug: targetStaff.gym.slug,
      },
    };
  }

  private generateToken(staff: { id: string; email: string; role: string; gymId: string | null; name: string }) {
    const payload: JwtPayload = {
      sub: staff.id,
      gymId: staff.gymId,
      email: staff.email,
      role: staff.role as any,
      name: staff.name,
    };
    return this.jwtService.sign(payload);
  }
}
