import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsIn,
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMemberDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  // Optional initial membership plan to activate upon creation
  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'QUARTERLY', 'BIANNUAL', 'ANNUAL', 'SESSION_PASS'])
  planType?: 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL' | 'SESSION_PASS';

  @IsOptional()
  @IsInt()
  @Min(0)
  planPricePaisa?: number; // Minor units (paisa)
}
