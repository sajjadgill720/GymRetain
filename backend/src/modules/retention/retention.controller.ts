import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import { RetentionService, RiskLevel } from './retention.service';
import { RecordInterventionDto } from './dto/record-intervention.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

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

  @Post('interventions')
  async recordIntervention(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordInterventionDto,
  ) {
    return this.retentionService.recordIntervention(gymId, dto, user.sub, user.role);
  }

  @Get('members/:memberId/interventions')
  async getMemberInterventions(
    @CurrentGymId() gymId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.retentionService.getMemberInterventions(gymId, memberId);
  }
}

