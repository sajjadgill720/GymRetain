import { Type } from 'class-transformer';
import { IsBoolean, IsDefined, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Length, Matches, Max, Min, ValidateNested, IsUrl } from 'class-validator';
export class ProfileDto {
  @IsOptional() @IsString() @Length(1,200) goal?:string;
  @IsOptional() @IsInt() @Min(1) @Max(7) weeklyTarget?:number;
  @IsOptional() @IsBoolean() onboarded?:boolean;
  @IsOptional() @IsBoolean() notifications?:boolean;
  @IsOptional() @IsString() @Length(1,100) firstName?:string;
  @IsOptional() @IsString() @Length(1,100) lastName?:string;
}
export class WorkoutDto {
  @IsString() @Length(1,200) title:string;
  @IsInt() @Min(1) @Max(480) minutes:number;
  @IsOptional() @IsString() @Length(0,2000) notes?:string;
}
export class RecordDto {
  @IsString() @Length(1,100) exercise:string;
  @IsNumber() @Min(0) @Max(1000) weightKg:number;
  @IsInt() @Min(1) @Max(1000) reps:number;
}
export class MeasurementDto {
  @IsNumber() @Min(20) @Max(500) weightKg:number;
  @IsOptional() @IsNumber() @Min(20) @Max(300) waistCm?:number;
}
export class MessageDto { @IsString() @Length(1,2000) content:string; }
export class RequestDto {
  @IsIn(['DIET_CHANGE','FREEZE_MEMBERSHIP','CHANGE_PLAN','BUDDY','HELP','FEEDBACK']) kind:string;
  @IsString() @Length(1,2000) message:string;
}
export class MealDto { @IsUUID() mealId:string; @IsBoolean() checked:boolean; }
export class CheckoutDto { @IsIn(['JAZZCASH','EASYPAISA','STRIPE']) provider:'JAZZCASH'|'EASYPAISA'|'STRIPE'; }
export class JoinDto {
  @IsString() @Length(1,100) firstName:string;
  @IsString() @Length(1,100) lastName:string;
  @IsString() @Length(8,30) phone:string;
}
class PushKeysDto {
  @IsString() @Matches(/^[A-Za-z0-9_-]{40,200}$/) p256dh:string;
  @IsString() @Matches(/^[A-Za-z0-9_-]{16,100}$/) auth:string;
}
export class PushDto {
  @IsUrl({protocols:['https'],require_protocol:true}) @Length(1,2000) endpoint:string;
  @IsDefined() @ValidateNested() @Type(()=>PushKeysDto) keys:PushKeysDto;
}
export class AnnouncementDto { @IsString() @Length(1,200) title:string; @IsString() @Length(1,2000) body:string; }
export class GatewayCallbackDto {
  @IsUUID() paymentId:string;
  @IsUUID() gymId:string;
  @IsIn(['COMPLETED','FAILED']) status:'COMPLETED'|'FAILED';
  @IsInt() @Min(1) amount:number;
  @IsString() @Length(3,3) currency:string;
  @IsString() @Length(1,255) reference:string;
  @IsInt() timestamp:number;
}
