import { Module } from '@nestjs/common';
import { SaasBillingController } from './saas-billing.controller';
import { SaasBillingService } from './saas-billing.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SaasBillingController],
  providers: [SaasBillingService],
  exports: [SaasBillingService],
})
export class SaasBillingModule {}
