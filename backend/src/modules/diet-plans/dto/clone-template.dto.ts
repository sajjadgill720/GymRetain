import { IsUUID, IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';

export class CloneTemplateDto {
  @IsUUID()
  @IsNotEmpty()
  templateId: string;

  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsOptional()
  @IsString()
  customTitle?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  sendWhatsAppNotification?: boolean;
}
