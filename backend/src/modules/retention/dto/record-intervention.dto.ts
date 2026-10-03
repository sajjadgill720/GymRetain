import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RecordInterventionDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsIn(['ASSIGNED', 'CONTACTED_WHATSAPP', 'CONTACTED_PHONE', 'OFFER_EXTENDED', 'RESOLVED_RETAINED', 'LOST_CHURNED'])
  status: 'ASSIGNED' | 'CONTACTED_WHATSAPP' | 'CONTACTED_PHONE' | 'OFFER_EXTENDED' | 'RESOLVED_RETAINED' | 'LOST_CHURNED';

  @IsOptional()
  @IsString()
  assignedStaffId?: string;

  @IsOptional()
  @IsString()
  assignedStaffName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  outreachDraft?: string;

  @IsOptional()
  @IsString()
  followUpDate?: string;
}
