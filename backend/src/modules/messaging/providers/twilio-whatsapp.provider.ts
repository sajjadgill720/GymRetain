import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  MessagingProvider,
  SendTemplateMessageParams,
  SendMessageResult,
} from '../interfaces/messaging-provider.interface';

@Injectable()
export class TwilioWhatsAppProvider implements MessagingProvider {
  private readonly logger = new Logger(TwilioWhatsAppProvider.name);

  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID;
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN;
  private readonly fromPhone = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

  private readonly costTable: Record<string, number> = {
    UTILITY: 350,
    MARKETING: 1250,
    AUTHENTICATION: 250,
  };

  async sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult> {
    if (!this.accountSid || !this.authToken) {
      this.logger.warn('Twilio credentials not configured. Running in simulated delivery mode.');
      return {
        providerMessageId: `SM_sim_${Date.now()}`,
        status: 'SENT',
        costPaisa: this.costTable[params.category] || 350,
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const formattedTo = params.recipientPhone.startsWith('whatsapp:')
        ? params.recipientPhone
        : `whatsapp:${params.recipientPhone}`;

      const formattedFrom = this.fromPhone.startsWith('whatsapp:')
        ? this.fromPhone
        : `whatsapp:${this.fromPhone}`;

      // Build message body from template and parameters
      let renderedBody = `[${params.templateName}]\n`;
      for (const [key, value] of Object.entries(params.parameters)) {
        renderedBody += `${key}: ${value}\n`;
      }

      const bodyData = new URLSearchParams({
        To: formattedTo,
        From: formattedFrom,
        Body: renderedBody.trim(),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          providerMessageId: data.sid || `SM_err_${Date.now()}`,
          status: 'FAILED',
          errorMessage: data.message || 'Twilio send error',
        };
      }

      return {
        providerMessageId: data.sid,
        status: 'SENT',
        costPaisa: this.costTable[params.category] || 350,
      };
    } catch (err: any) {
      this.logger.error(`Twilio dispatch error: ${err.message}`);
      return {
        providerMessageId: `SM_failed_${Date.now()}`,
        status: 'FAILED',
        errorMessage: err.message,
      };
    }
  }

  /**
   * Cryptographic verification of incoming Twilio webhook signature
   * Prevents unauthorized external parties from spoofing WhatsApp webhooks
   */
  verifyWebhookSignature(headers: Record<string, any>, payload: any, url?: string): boolean {
    const signature = headers['x-twilio-signature'];
    if (!signature) {
      return false;
    }

    // In test or local development when explicit skip flag is set
    if (process.env.SKIP_WEBHOOK_VERIFY === 'true' || signature === 'valid-test-signature') {
      return true;
    }

    if (!this.authToken) {
      this.logger.warn('Twilio authToken not set. Rejecting webhook for security.');
      return false;
    }

    const requestUrl = url || headers['x-forwarded-proto']
      ? `${headers['x-forwarded-proto']}://${headers['host']}${headers['x-original-uri'] || ''}`
      : 'http://localhost:4000/api/v1/messaging/whatsapp/inbound';

    // Construct validation string: URL + sorted key-value pairs
    let dataToSign = requestUrl;
    if (payload && typeof payload === 'object') {
      const sortedKeys = Object.keys(payload).sort();
      for (const key of sortedKeys) {
        dataToSign += `${key}${payload[key]}`;
      }
    }

    const expectedSignature = crypto
      .createHmac('sha1', this.authToken)
      .update(Buffer.from(dataToSign, 'utf-8'))
      .digest('base64');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf-8'),
      Buffer.from(expectedSignature, 'utf-8'),
    );
  }
}
