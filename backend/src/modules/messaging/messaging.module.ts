import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { AutomationTriggerService } from './automation-trigger.service';
import { TwilioWhatsAppProvider } from './providers/twilio-whatsapp.provider';
import { MockWhatsAppProvider } from './providers/mock-whatsapp.provider';
import { TwilioWebhookGuard } from './guards/twilio-webhook.guard';

@Module({
  controllers: [MessagingController],
  providers: [
    MessagingService,
    AutomationTriggerService,
    TwilioWebhookGuard,
    {
      provide: 'MessagingProvider',
      useClass:
        process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
          ? TwilioWhatsAppProvider
          : MockWhatsAppProvider,
    },
  ],
  exports: [MessagingService, AutomationTriggerService, 'MessagingProvider'],
})
export class MessagingModule {}
