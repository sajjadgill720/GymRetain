import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { SaasBillingService } from './saas-billing.service';
import { CreateCheckoutDto, SimulateWebhookDto } from './dto/create-checkout.dto';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@Controller('saas-billing')
@UseGuards(TenantAccessGuard, RolesGuard)
export class SaasBillingController {
  constructor(private readonly billingService: SaasBillingService) {}

  @Get('status')
  async getStatus(@CurrentGymId() gymId: string) {
    return this.billingService.getSubscriptionStatus(gymId);
  }

  @Post('checkout')
  @Roles('GYM_OWNER')
  async createCheckout(
    @CurrentGymId() gymId: string,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.billingService.createCheckoutSession(
      gymId,
      dto.plan,
      dto.billingInterval || 'monthly',
    );
  }

  @Post('simulate-payment')
  @Roles('GYM_OWNER')
  async simulatePayment(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SimulateWebhookDto,
  ) {
    if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BILLING_SANDBOX !== 'true') {
      throw new ForbiddenException('Payment simulation is disabled. A verified payment provider is required.');
    }
    return this.billingService.confirmSubscriptionPayment(
      gymId,
      dto.plan,
      'SANDBOX_SIMULATOR',
      dto.invoiceNumber,
      user.sub,
      user.role,
    );
  }

  @Post('cancel')
  @Roles('GYM_OWNER')
  async cancelSubscription(
    @CurrentGymId() gymId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.billingService.cancelSubscription(gymId, user.sub, user.role);
  }

  @Get('invoices')
  @Roles('GYM_OWNER')
  async listInvoices(@CurrentGymId() gymId: string) {
    return this.billingService.listInvoices(gymId);
  }
}
