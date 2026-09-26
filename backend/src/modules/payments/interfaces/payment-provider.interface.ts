export interface InitiatePaymentParams {
  gymId: string;
  memberId: string;
  membershipId?: string;
  amountPaisa: number;
  currency: string; // e.g. "PKR"
  description: string;
  customerPhone: string;
  customerEmail?: string;
  customerName: string;
  callbackUrl: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  paymentUrl?: string;
  providerReference: string;
  rawResponse?: any;
}

export interface VerifyPaymentResult {
  isSuccess: boolean;
  status: 'COMPLETED' | 'FAILED' | 'PENDING';
  providerTransactionId?: string;
  amountPaisa?: number;
  failureReason?: string;
  rawResponse?: any;
}

/**
 * Phase 3 Payment Provider Interface abstraction
 * Implementations: JazzCashProvider, EasypaisaProvider, StripeProvider
 */
export interface PaymentProvider {
  initiatePayment(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verifyPayment(payload: any): Promise<VerifyPaymentResult>;
  verifyWebhookIntegrity(payload: any, signature: string): boolean;
}
