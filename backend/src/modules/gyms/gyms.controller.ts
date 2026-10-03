import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { GymsService } from './gyms.service';
import { UpdateGymDto } from './dto/update-gym.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('gyms')
@UseGuards(TenantAccessGuard, RolesGuard)
export class GymsController {
  constructor(private readonly gymsService: GymsService) {}

  @Get('my-gym')
  async getMyGym(@CurrentGymId() gymId: string) {
    return this.gymsService.getGymDetails(gymId);
  }

  @Patch('my-gym')
  @Roles('GYM_OWNER')
  async updateMyGym(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateGymDto,
  ) {
    return this.gymsService.updateGymDetails(gymId, dto, user.sub, user.role);
  }

  @Get('capacity')
  async getCapacityStatus(@CurrentGymId() gymId: string) {
    return this.gymsService.getCapacityStatus(gymId);
  }

  @Get('qr-code')
  async getFrontDeskQrCode(@CurrentGymId() gymId: string) {
    return this.gymsService.getFrontDeskQrCode(gymId);
  }

  @Post('qr-code/rotate')
  @Roles('GYM_OWNER')
  async rotateQrSecret(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.gymsService.rotateQrSecret(gymId, user.sub, user.role);
  }
}
