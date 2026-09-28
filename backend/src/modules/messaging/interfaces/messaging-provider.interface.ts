export type MessageCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export interface SendTemplateMessageParams {
  gymId: string;
  recipientPhone: string;
  templateId: string;
  templateName: string;
  category: MessageCategory;
  parameters: Record<string, string>;
  memberId?: string;
}

export interface SendMessageResult {
  providerMessageId: string;
  status: 'QUEUED' | 'SENT' | 'FAILED';
  costPaisa?: number;
  errorMessage?: string;
}

/**
 * Phase 2 Messaging Provider Interface abstraction
 * Implementations: TwilioWhatsAppProvider, MetaDirectWhatsAppProvider
 */
export interface MessagingProvider {
  sendTemplateMessage(params: SendTemplateMessageParams): Promise<SendMessageResult>;
  verifyWebhookSignature(headers: Record<string, any>, payload: any, url?: string): boolean;
  getDeliveryStatus?(providerMessageId: string): Promise<string>;
}
