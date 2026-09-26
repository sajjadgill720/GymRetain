import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'gymretain-super-secure-jwt-secret-min-32-chars-long',
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const staff = await this.prisma.gymStaff.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, gymId: true, isActive: true, name: true },
    });

    if (!staff || !staff.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    return {
      sub: staff.id,
      gymId: staff.gymId,
      email: staff.email,
      role: staff.role as any,
      name: staff.name,
    };
  }
}
