import { Injectable, Logger } from '@nestjs/common';
import {
  MessagingProvider,
  SendTemplateMessageParams,
  SendMessageResult,
} from '../interfaces/messaging-provider.interface';

@Injectable()
export class MockWhatsAppProvider implements MessagingProvider {
  private readonly logger = new Logger(MockWhatsAppProvider.name);
  public sentMessages: SendTemplateMessageParams[] = [];

  // Meta Standard Pricing for Pakistan in paisa (1 PKR = 100 paisa)
  // Utility: ~3.50 PKR (350 paisa), Marketing: ~12.50 PKR (1250 paisa)
  private readonly costTable: Record<string, number> = {
    UTILITY: 350,
    MARKETING: 1250,
    AUTHENTICATION: 250,
  };

  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult> {
    this.sentMessages.push(params);

    this.logger.log(
      `[MockWhatsAppProvider] Sending ${params.category} template "${params.templateName}" to ${params.recipientPhone} (Gym: ${params.gymId})`,
    );

    const costPaisa = this.costTable[params.category] || 350;

    return {
      providerMessageId: `SM_mock_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      status: 'SENT',
      costPaisa,
    };
  }

  verifyWebhookSignature(headers: Record<string, any>, payload: any, url?: string): boolean {
    const signature = headers['x-twilio-signature'] || headers['x-hub-signature-256'];
    if (!signature) {
      return false;
    }
    // In mock/test environments, validate signature header presence or test token
    if (signature === 'valid-test-signature' || process.env.NODE_ENV === 'test') {
      return true;
    }
    return signature.length > 10;
  }

  async getDeliveryStatus(providerMessageId: string): Promise<string> {
    return 'DELIVERED';
  }
}
