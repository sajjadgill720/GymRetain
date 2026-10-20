import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Patch, Post, Req, Sse, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Public } from '../../common/decorators/public.decorator';
import { MemberService } from './member.service';
import { MemberPassService } from './member-pass.service';
import { MemberIdentity } from '../auth/member-identity';
import { ProfileDto, WorkoutDto, RecordDto, MeasurementDto, RequestDto, MealDto, MessageDto, CheckoutDto, PushDto } from './member.dto';
import { MemberPaymentService } from './member-payment.service';
import { MemberPushService } from './member-push.service';
import { PortalEventsService } from './portal-events.service';

@Public() // Staff global guard is replaced by the member-only strategy on every route.
@UseGuards(AuthGuard('member-jwt'))
@Controller('member')
export class MemberController {
  constructor(private readonly members:MemberService,private readonly passes:MemberPassService,private readonly payments:MemberPaymentService,private readonly push:MemberPushService,private readonly events:PortalEventsService) {}
  @Sse('events') eventsStream(@Req() req:{user:MemberIdentity},@Headers('last-event-id') lastId:string) {return this.events.stream(req.user,lastId);}
  @Get('push/config') pushConfig() {return this.push.config();}
  @Post('push/subscribe') subscribe(@Req() req:{user:MemberIdentity},@Body() dto:PushDto) {return this.push.subscribe(req.user,dto);}
  @Post('push/unsubscribe') unsubscribe(@Req() req:{user:MemberIdentity}) {return this.push.unsubscribe(req.user);}
  @Get('overview') overview(@Req() req:{user:MemberIdentity}) {return this.members.overview(req.user);}
  @Patch('profile') profile(@Req() req:{user:MemberIdentity},@Body() dto:ProfileDto) {return this.members.profile(req.user,dto);}
  @Get('pass') pass(@Req() req:{user:MemberIdentity}) {return this.passes.issue(req.user);}
  @Post('classes/:id/book') book(@Req() req:{user:MemberIdentity},@Param('id',ParseUUIDPipe) id:string) {return this.members.book(req.user,id);}
  @Post('classes/:id/cancel') cancel(@Req() req:{user:MemberIdentity},@Param('id',ParseUUIDPipe) id:string) {return this.members.book(req.user,id,true);}
  @Post('rewards/:id/redeem') redeem(@Req() req:{user:MemberIdentity},@Param('id',ParseUUIDPipe) id:string) {return this.members.redeem(req.user,id);}
  @Post('streak/freeze') freeze(@Req() req:{user:MemberIdentity}) {return this.members.freeze(req.user);}
  @Post('workouts') workout(@Req() req:{user:MemberIdentity},@Body() dto:WorkoutDto) {return this.members.workout(req.user,dto);}
  @Post('records') record(@Req() req:{user:MemberIdentity},@Body() dto:RecordDto) {return this.members.record(req.user,dto);}
  @Post('measurements') measurement(@Req() req:{user:MemberIdentity},@Body() dto:MeasurementDto) {return this.members.measurement(req.user,dto);}
  @Post('diet/meal') meal(@Req() req:{user:MemberIdentity},@Body() dto:MealDto) {return this.members.meal(req.user,dto);}
  @Post('requests') request(@Req() req:{user:MemberIdentity},@Body() dto:RequestDto) {return this.members.request(req.user,dto);}
  @Get('messages') messages(@Req() req:{user:MemberIdentity}) {return this.members.messages(req.user);}
  @Post('messages') message(@Req() req:{user:MemberIdentity},@Body() dto:MessageDto) {return this.members.messages(req.user,dto.content);}
  @Post('payments/checkout') @HttpCode(200) checkout(@Req() req:{user:MemberIdentity},@Body() dto:CheckoutDto) {return this.payments.checkout(req.user,dto);}
}
