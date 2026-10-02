import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, IsDateString } from 'class-validator';
import { PaymentProviderType, PaymentStatus } from '@prisma/client';

export class RecordPaymentDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsOptional()
  @IsString()
  membershipId?: string;

  @IsNumber()
  @Min(0)
  amount: number; // e.g. 5000 PKR

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentProviderType)
  provider: PaymentProviderType; // CASH, BANK_TRANSFER, JAZZCASH, EASYPAISA, etc.

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  providerReference?: string; // Receipt number or bank transfer reference

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
