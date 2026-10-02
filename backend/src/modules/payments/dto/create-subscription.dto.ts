import { IsString, IsNotEmpty, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, Min } from 'class-validator';
import { PlanType } from '@prisma/client';

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsNotEmpty()
  planName: string;

  @IsEnum(PlanType)
  planType: PlanType;

  @IsNumber()
  @Min(0)
  price: number; // e.g. 5000 PKR

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
