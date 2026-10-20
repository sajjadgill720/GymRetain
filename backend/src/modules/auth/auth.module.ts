import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { MemberAuthController } from './member-auth.controller';
import { MemberAuthService } from './member-auth.service';
import { MemberJwtStrategy } from './member-jwt.strategy';
import { MemberPrismaService } from '../../prisma/member-prisma.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret') || 'gymretain-super-secure-jwt-secret-min-32-chars-long',
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn') || '7d',
        },
      }),
    }),
  ],
  controllers: [AuthController, MemberAuthController],
  providers: [AuthService, JwtStrategy, MemberAuthService, MemberJwtStrategy, MemberPrismaService],
  exports: [AuthService, JwtStrategy, PassportModule, MemberAuthService, MemberPrismaService],
})
export class AuthModule {}
