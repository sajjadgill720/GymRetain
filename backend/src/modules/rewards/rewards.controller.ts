import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('rewards')
@UseGuards(TenantAccessGuard, RolesGuard)
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  async listRewards(@CurrentGymId() gymId: string) {
    return this.rewardsService.listRewards(gymId);
  }

  @Get('winners')
  async listWinners(@CurrentGymId() gymId: string) {
    return this.rewardsService.listAllRedemptions(gymId);
  }

  @Post()
  @Roles('GYM_OWNER')
  async createReward(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateRewardDto,
  ) {
    return this.rewardsService.createReward(gymId, dto);
  }

  @Get('member/:memberId')
  async getMemberRedemptions(
    @CurrentGymId() gymId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.rewardsService.getMemberRedemptions(gymId, memberId);
  }

  @Patch('redemptions/:redemptionId/redeem')
  async redeemReward(
    @CurrentGymId() gymId: string,
    @Param('redemptionId') redemptionId: string,
    @CurrentUser() user: JwtPayload,
    @Body('notes') notes?: string,
  ) {
    return this.rewardsService.redeemReward(gymId, redemptionId, user.sub, notes);
  }
}
