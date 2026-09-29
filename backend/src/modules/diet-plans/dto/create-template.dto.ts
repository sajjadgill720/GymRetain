import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DietPlanMealDto } from './create-diet-plan.dto';

export class CreateDietTemplateDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsIn(['WEIGHT_LOSS', 'MUSCLE_GAIN', 'MAINTENANCE', 'CUSTOM'])
  @IsNotEmpty()
  goal: 'WEIGHT_LOSS' | 'MUSCLE_GAIN' | 'MAINTENANCE' | 'CUSTOM';

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DietPlanMealDto)
  meals: DietPlanMealDto[];
}
