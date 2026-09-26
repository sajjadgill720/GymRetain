import { IsEmail, IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @IsIn(['GYM_STAFF', 'GYM_OWNER'])
  role: 'GYM_STAFF' | 'GYM_OWNER';
}
