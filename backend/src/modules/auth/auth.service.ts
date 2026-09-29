import {
  Injectable,
  ConflictException,
  UnauthorizedException,
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
   */
  async login(dto: LoginDto) {
    const staff = await this.prisma.gymStaff.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { gym: true },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await bcrypt.compare(dto.password, staff.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.prisma.gymStaff.update({
      where: { id: staff.id },
      data: { lastLoginAt: new Date() },
    });

    const token = this.generateToken(staff);

    return {
      token,
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        role: staff.role,
        gymId: staff.gymId,
        gymName: staff.gym?.name ?? null,
        gymSlug: staff.gym?.slug ?? null,
      },
    };
  }

  /**
   * Gym Owner invites a new staff member to their gym
   */
  async inviteStaff(gymId: string, dto: InviteStaffDto) {
    const existing = await this.prisma.gymStaff.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    // Default temporary password for invite
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
      temporaryPassword: defaultPassword,
      message: 'Staff member invited successfully',
    };
  }

  /**
   * Returns the authenticated user's profile and their gym details.
   * Gym info is fetched from the database, scoped by the JWT's gymId claim.
   */
  async getMe(jwtUser: JwtPayload) {
    const staff = await this.prisma.gymStaff.findUnique({
      where: { id: jwtUser.sub },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        gymId: true,
        gym: {
          select: {
            id: true,
            name: true,
            slug: true,
            phone: true,
            address: true,
            currency: true,
            timezone: true,
            status: true,
          },
        },
      },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('Account is inactive or not found');
    }

    return {
      user: {
        id: staff.id,
        email: staff.email,
        name: staff.name,
        phone: staff.phone,
        role: staff.role,
      },
      // Returns an array for forward-compatibility if multi-gym is ever added.
      // Currently always 0 or 1 gym.
      gyms: staff.gym
        ? [
            {
              id: staff.gym.id,
              name: staff.gym.name,
              slug: staff.gym.slug,
              city: staff.gym.address || '',
              currency: staff.gym.currency,
              timezone: staff.gym.timezone,
              status: staff.gym.status,
            },
          ]
        : [],
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
