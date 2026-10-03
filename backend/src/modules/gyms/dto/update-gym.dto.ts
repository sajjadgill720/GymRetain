import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateGymDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  capacity?: number;

  @IsOptional()
  @IsString()
  capacityPolicy?: 'WARNING_ONLY' | 'BLOCK_ADMISSION';
}

