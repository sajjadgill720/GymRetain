import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RetentionService, RiskLevel } from './retention.service';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';

@Controller('retention')
@UseGuards(TenantAccessGuard)
export class RetentionController {
  constructor(private readonly retentionService: RetentionService) {}

  @Get('at-risk-members')
  async getAtRiskMembers(
    @CurrentGymId() gymId: string,
    @Query('level') level?: RiskLevel,
  ) {
    return this.retentionService.getAtRiskMembers(gymId, level);
  }
}
