import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { Public } from '../../common/decorators/public.decorator';

export class SimulateInboundDto {
  phone: string;
  message: string;
  gymId?: string;
}

@Controller('messaging')
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Inbound WhatsApp Keyword endpoint (also acts as Twilio / Meta webhook endpoint)
   * Member texts "STREAK" -> returns personal streak & reward progress
   */
  @Public()
  @Post('whatsapp/inbound')
  @HttpCode(HttpStatus.OK)
  async handleInbound(@Body() body: any) {
    const senderPhone = body.From || body.from || body.phone;
    const messageBody = body.Body || body.body || body.message || 'STREAK';
    const gymId = body.gymId;

    return this.messagingService.handleInboundWhatsAppMessage(
      senderPhone,
      messageBody,
      gymId,
    );
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
}
