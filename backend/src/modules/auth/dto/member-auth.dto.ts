import { IsIn, IsString, IsUUID, Length, Matches } from 'class-validator';
export class RequestMemberOtpDto {
  @IsString() @Matches(/^[a-z0-9-]{2,100}$/) gymSlug:string;
  @IsString() @Length(8,30) phone:string;
  @IsIn(['sms','whatsapp']) channel:'sms'|'whatsapp';
}
export class VerifyMemberOtpDto {
  @IsString() @Matches(/^[a-z0-9-]{2,100}$/) gymSlug:string;
  @IsUUID() requestId:string;
  @IsString() @Matches(/^\d{6}$/) code:string;
}
