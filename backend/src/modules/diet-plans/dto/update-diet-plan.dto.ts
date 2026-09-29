import {
  IsString,
  IsIn,
  IsOptional,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietPlanMealDto } from './create-diet-plan.dto';

export class UpdateDietPlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsIn(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'CUSTOM'])
  goal?: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM';

  @IsOptional()
  @IsString()
  customGoal?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanMealDto)
  meals?: DietPlanMealDto[];

  @IsOptional()
  @IsBoolean()
  sendWhatsAppNotification?: boolean;
}
