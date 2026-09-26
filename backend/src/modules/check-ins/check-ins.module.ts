import { Module } from '@nestjs/common';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';
import { StreaksModule } from '../streaks/streaks.module';
import { RewardsModule } from '../rewards/rewards.module';

@Module({
  imports: [StreaksModule, RewardsModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
  exports: [CheckInsService],
})
export class CheckInsModule {}
