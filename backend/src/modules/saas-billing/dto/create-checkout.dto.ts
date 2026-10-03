import { IsString, IsIn, IsOptional } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsIn(['STARTER', 'PRO', 'ENTERPRISE'])
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsOptional()
  @IsIn(['monthly', 'annual'])
  billingInterval?: 'monthly' | 'annual';
}

export class SimulateWebhookDto {
  @IsString()
  plan: 'STARTER' | 'PRO' | 'ENTERPRISE';

  @IsOptional()
  @IsString()
  invoiceNumber?: string;
}
