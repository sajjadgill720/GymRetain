import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MemberController } from './member.controller';
import { MemberPublicController } from './member-public.controller';
import { MemberService } from './member.service';
import { MemberPaymentService } from './member-payment.service';
import { MemberPassService } from './member-pass.service';
import { MemberJoinService } from './member-join.service';

@Module({imports:[AuthModule],controllers:[MemberController,MemberPublicController],providers:[MemberService,MemberPaymentService,MemberPassService,MemberJoinService]})
export class MemberModule {}
