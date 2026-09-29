import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsIn,
  IsOptional,
  ValidateNested,
  IsArray,
  IsInt,
  IsNumber,
  Min,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DietPlanMealDto {
  @IsIn(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'])
  @IsNotEmpty()
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbsG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fatG?: number;

  @IsOptional()
  @IsInt()
  orderIndex?: number;
}

export class CreateDietPlanDto {
  @IsUUID()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'CUSTOM'])
  @IsNotEmpty()
  goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM';

  @IsOptional()
  @IsString()
  customGoal?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanMealDto)
  meals: DietPlanMealDto[];

  @IsOptional()
  @IsBoolean()
  sendWhatsAppNotification?: boolean;
}
