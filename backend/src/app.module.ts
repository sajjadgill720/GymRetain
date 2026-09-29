import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { GymsModule } from './modules/gyms/gyms.module';
import { MembersModule } from './modules/members/members.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { RewardsModule } from './modules/rewards/rewards.module';
import { CheckInsModule } from './modules/check-ins/check-ins.module';
import { RetentionModule } from './modules/retention/retention.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { TrainersModule } from './modules/trainers/trainers.module';
import { DietPlansModule } from './modules/diet-plans/diet-plans.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig],
    }),
    PrismaModule,
    AuthModule,
    GymsModule,
    MembersModule,
    StreaksModule,
    RewardsModule,
    CheckInsModule,
    RetentionModule,
    AnalyticsModule,
    MessagingModule,
    PaymentsModule,
    TrainersModule,
    DietPlansModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
