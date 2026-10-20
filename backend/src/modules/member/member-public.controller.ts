import { Body, Controller, Get, Headers, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { MemberAuthService } from '../auth/member-auth.service';
import { MemberJoinService } from './member-join.service';
import { MemberPaymentService } from './member-payment.service';
import { GatewayCallbackDto, JoinDto } from './member.dto';

@Public()
@Controller('member')
export class MemberPublicController {
  constructor(private readonly auth:MemberAuthService,private readonly joins:MemberJoinService,private readonly payments:MemberPaymentService) {}
  @Get('join/:slug') gym(@Param('slug') slug:string) {return this.auth.publicGym(slug);}
  @Post('join/:slug') join(@Param('slug') slug:string,@Body() dto:JoinDto,@Req() req:Request) {return this.joins.join(slug,dto,req.ip||req.socket.remoteAddress||'unknown');}
  @Post('payments/callback') callback(@Body() dto:GatewayCallbackDto,@Headers('x-gateway-signature') signature:string) {return this.payments.callback(dto,signature);}
}
