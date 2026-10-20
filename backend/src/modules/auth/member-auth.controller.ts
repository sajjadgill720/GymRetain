import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { MemberAuthService } from './member-auth.service';
import { RequestMemberOtpDto, VerifyMemberOtpDto } from './dto/member-auth.dto';

@Public()
@Controller('auth/member')
export class MemberAuthController {
  constructor(private readonly auth:MemberAuthService) {}
  @Post('request-otp') @HttpCode(200)
  request(@Body() dto:RequestMemberOtpDto,@Req() req:Request) { return this.auth.request(dto,req.ip||req.socket.remoteAddress||'unknown'); }
  @Post('verify-otp') @HttpCode(200)
  verify(@Body() dto:VerifyMemberOtpDto,@Req() req:Request) { return this.auth.verify(dto,req.ip||req.socket.remoteAddress||'unknown'); }
}
