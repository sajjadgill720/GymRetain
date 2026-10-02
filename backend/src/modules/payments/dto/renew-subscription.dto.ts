import { IsOptional, IsNumber, IsBoolean, IsEnum, Min } from 'class-validator';
import { PaymentProviderType } from '@prisma/client';

export class RenewSubscriptionDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  durationMonths?: number; // Defaults to 1 month

  @IsOptional()
  @IsBoolean()
  recordPayment?: boolean;

  @IsOptional()
  @IsEnum(PaymentProviderType)
  paymentProvider?: PaymentProviderType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}
