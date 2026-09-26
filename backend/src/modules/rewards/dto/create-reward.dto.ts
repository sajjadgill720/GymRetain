import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsInt,
  Min,
} from 'class-validator';

export class CreateRewardDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @IsIn(['BADGE', 'DISCOUNT_PERCENT', 'DISCOUNT_FIXED', 'FREE_DAYS', 'FREE_ITEM'])
  rewardType: 'BADGE' | 'DISCOUNT_PERCENT' | 'DISCOUNT_FIXED' | 'FREE_DAYS' | 'FREE_ITEM';

  @IsString()
  @IsIn(['STREAK_MILESTONE', 'TOTAL_CHECKINS', 'MANUAL'])
  triggerType: 'STREAK_MILESTONE' | 'TOTAL_CHECKINS' | 'MANUAL';

  @IsInt()
  @Min(1)
  triggerThreshold: number; // e.g. 10 for 10-day streak

  @IsOptional()
  @IsInt()
  rewardValue?: number; // e.g. 10 for 10% discount, 50000 paisa, 7 free days

  @IsOptional()
  @IsString()
  badgeIcon?: string;
}
