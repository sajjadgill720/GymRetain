import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { RecordCheckInDto } from './dto/record-checkin.dto';
import { RecordCheckOutDto, CorrectCheckOutDto } from './dto/record-checkout.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('check-ins')
@UseGuards(TenantAccessGuard, RolesGuard)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Post()
  async recordCheckIn(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordCheckInDto,
  ) {
    return this.checkInsService.recordCheckIn(gymId, dto, user.sub);
  }

  @Post('checkout')
  async recordCheckOut(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordCheckOutDto,
  ) {
    return this.checkInsService.recordCheckOut(gymId, dto, user.sub);
  }

  @Patch(':id/correct')
  @Roles('GYM_OWNER', 'GYM_MANAGER')
  async correctMissedCheckOut(
    @CurrentGymId() gymId: string,
    @Param('id') sessionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CorrectCheckOutDto,
  ) {
    return this.checkInsService.correctMissedCheckOut(
      gymId,
      sessionId,
      dto,
      user.sub,
      user.role,
    );
  }

  @Get('open')
  async listOpenSessions(@CurrentGymId() gymId: string) {
    return this.checkInsService.listOpenSessions(gymId);
  }

  @Get('recent')
  async listRecentCheckIns(
    @CurrentGymId() gymId: string,
    @Query('limit') limit?: string,
  ) {
    return this.checkInsService.listRecentCheckIns(
      gymId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post('stale/auto-close')
  @Roles('GYM_OWNER', 'GYM_MANAGER')
  async autoCloseStaleSessions(
    @CurrentGymId() gymId: string,
    @Query('maxHours') maxHours?: string,
  ) {
    return this.checkInsService.autoCloseStaleSessions(
      gymId,
      maxHours ? parseInt(maxHours, 10) : 6,
    );
  }

  @Post('legacy/reconcile')
  @Roles('GYM_OWNER')
  async reconcileLegacyCheckIns(@CurrentGymId() gymId: string) {
    return this.checkInsService.reconcileLegacyCheckIns(gymId);
  }
}
