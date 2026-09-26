import { Module } from '@nestjs/common';
import { StreaksService } from './streaks.service';

@Module({
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
