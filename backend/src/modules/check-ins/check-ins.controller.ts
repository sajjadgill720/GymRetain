import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CheckInsService } from './check-ins.service';
import { RecordCheckInDto } from './dto/record-checkin.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('check-ins')
@UseGuards(TenantAccessGuard)
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
}
