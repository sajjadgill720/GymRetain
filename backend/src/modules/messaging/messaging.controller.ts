import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { AutomationTriggerService } from './automation-trigger.service';
import { TwilioWebhookGuard } from './guards/twilio-webhook.guard';
import { Public } from '../../common/decorators/public.decorator';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';

export class SimulateInboundDto {
  phone: string;
  message: string;
  gymId?: string;
}

@Controller('messaging')
export class MessagingController {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly automationTriggerService: AutomationTriggerService,
  ) {}

  /**
   * Inbound WhatsApp Webhook (Twilio / Meta webhook endpoint)
   * Protected with cryptographic webhook signature verification (TwilioWebhookGuard)
   */
  @Public()
  @UseGuards(TwilioWebhookGuard)
  @Post('whatsapp/inbound')
  @HttpCode(HttpStatus.OK)
  async handleInbound(@Body() body: any) {
    const senderPhone = body.From || body.from || body.phone;
    const messageBody = body.Body || body.body || body.message || 'STREAK';
    const recipientGymPhone = body.To || body.to;

    // Gym is resolved server-side from recipient gym phone, not blindly from client
    return this.messagingService.handleInboundWhatsAppMessage(
      senderPhone,
      messageBody,
      undefined,
      recipientGymPhone,
    );
  }

  /**
   * Delivery Status Webhook (Twilio status callback)
   * Updates WhatsAppMessageLog status (DELIVERED, READ, FAILED)
   */
  @Public()
  @UseGuards(TwilioWebhookGuard)
  @Post('whatsapp/status')
  @HttpCode(HttpStatus.OK)
  async handleDeliveryStatus(@Body() body: any) {
    return this.messagingService.handleDeliveryStatusWebhook(body);
  }

  /**
   * Interactive Simulator endpoint for front-desk testing
   */
  @Public()
  @Post('whatsapp/simulate')
  @HttpCode(HttpStatus.OK)
  async simulateInbound(@Body() dto: SimulateInboundDto) {
    return this.messagingService.handleInboundWhatsAppMessage(
      dto.phone,
      dto.message,
      dto.gymId,
    );
  }

  /**
   * Cost Visibility Report (Aggregated per-gym message volume, category split, and cost in paisa)
   */
  @Get('cost-summary')
  @UseGuards(TenantAccessGuard)
  async getCostSummary(
    @CurrentGymId() gymId: string,
    @Query('days') days?: string,
  ) {
    return this.messagingService.getCostSummary(
      gymId,
      days ? parseInt(days, 10) : 30,
    );
  }

  /**
   * Trigger Missed Visit Outreach (Evaluates members inactive >= 5 days)
   */
  @Post('automation/trigger-missed-visits')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async triggerMissedVisits(@CurrentGymId() gymId: string) {
    return this.automationTriggerService.triggerMissedVisitNudges(gymId);
  }

  /**
   * Trigger Payment Reminders (Evaluates overdue or expiring memberships)
   */
  @Post('automation/trigger-payment-reminders')
  @UseGuards(TenantAccessGuard, RolesGuard)
  @Roles('GYM_OWNER')
  async triggerPaymentReminders(@CurrentGymId() gymId: string) {
    return this.automationTriggerService.triggerPaymentReminders(gymId);
  }
}
