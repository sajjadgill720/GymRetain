import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RecordCheckOutDto {
  @IsString()
  @IsNotEmpty()
  memberIdentifier: string; // Member ID, memberCode, phone, or specific checkInId

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CorrectCheckOutDto {
  @IsString()
  @IsNotEmpty()
  checkOutTime: string; // ISO timestamp of corrected departure

  @IsOptional()
  @IsString()
  notes?: string;
}
