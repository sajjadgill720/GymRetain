import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { RenewSubscriptionDto } from './dto/renew-subscription.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('payments')
@UseGuards(TenantAccessGuard, RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('subscriptions')
  async listSubscriptions(
    @CurrentGymId() gymId: string,
    @Query('status') status?: string,
  ) {
    return this.paymentsService.listSubscriptions(gymId, status);
  }

  @Post('subscriptions')
  async createSubscription(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.paymentsService.createSubscription(gymId, dto);
  }

  @Post('subscriptions/:id/renew')
  async renewSubscription(
    @CurrentGymId() gymId: string,
    @Param('id') membershipId: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.paymentsService.renewSubscription(gymId, membershipId, dto);
  }

  @Patch('subscriptions/:id/cancel')
  async cancelSubscription(
    @CurrentGymId() gymId: string,
    @Param('id') membershipId: string,
  ) {
    return this.paymentsService.cancelSubscription(gymId, membershipId);
  }

  @Get('records')
  async listPayments(@CurrentGymId() gymId: string) {
    return this.paymentsService.listPayments(gymId);
  }

  @Post('record')
  async recordPayment(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordPaymentDto,
  ) {
    return this.paymentsService.recordPayment(gymId, user.sub, dto);
  }

  @Get('metrics')
  async getMetrics(@CurrentGymId() gymId: string) {
    return this.paymentsService.getMetrics(gymId);
  }
}
