import { BadRequestException, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
import { addMonths } from 'date-fns';
import { MemberPrismaService } from '../../prisma/member-prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { MemberIdentity } from '../auth/member-identity';
import { CheckoutDto, GatewayCallbackDto } from './member.dto';

/** Hosted checkout adapter. Only a verified gateway callback can settle a payment. */
@Injectable()
export class MemberPaymentService {
  constructor(private readonly db:MemberPrismaService,private readonly tenant:TenantPrismaService) {}
  async checkout(who:MemberIdentity,dto:CheckoutDto) {
    const url=process.env.MEMBER_PAYMENT_GATEWAY_URL,secret=process.env.MEMBER_PAYMENT_GATEWAY_SECRET;
    if(!url||!secret||secret.length<32)throw new ServiceUnavailableException('Online renewal is not configured. Please contact your gym.');
    if(!url.startsWith('https://'))throw new ServiceUnavailableException('Checkout requires an HTTPS gateway');
    const payment=await this.db.run(who,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${who.memberId}))`;
      const membership=await tx.membership.findFirst({where:{gymId:who.gymId,memberId:who.memberId,status:{not:'CANCELLED'}},orderBy:{createdAt:'desc'}});
      if(!membership||membership.price<=0)throw new BadRequestException('Your gym must assign a paid plan first');
      const pending=await tx.payment.findFirst({where:{gymId:who.gymId,memberId:who.memberId,membershipId:membership.id,status:'PENDING',createdAt:{gt:new Date(Date.now()-1800000)}},orderBy:{createdAt:'desc'}});
      if(pending)throw new BadRequestException('A renewal is already pending. Check your invoices or contact your gym.');
      return tx.payment.create({data:{gymId:who.gymId,memberId:who.memberId,membershipId:membership.id,amount:membership.price,currency:membership.currency,provider:dto.provider,status:'PENDING',providerReference:`PORTAL-${randomUUID()}`,paymentMethodDetails:{kind:'MEMBER_RENEWAL',planType:membership.planType}}});
    });
    try {
      const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${secret}`},body:JSON.stringify({paymentId:payment.id,gymId:who.gymId,amount:payment.amount,currency:payment.currency,provider:dto.provider,reference:payment.providerReference,returnUrl:`${process.env.PORTAL_PUBLIC_URL||'http://localhost:3001'}/portal/membership`,callbackUrl:`${process.env.API_PUBLIC_URL||'http://localhost:4000/api/v1'}/member/payments/callback`}),signal:AbortSignal.timeout(15000)});
      const body=await response.json();if(!response.ok||typeof body.paymentUrl!=='string'||!body.paymentUrl.startsWith('https://'))throw new Error();
      return {paymentId:payment.id,paymentUrl:body.paymentUrl};
    } catch {
      await this.db.run(who,tx=>tx.payment.updateMany({where:{id:payment.id,gymId:who.gymId,memberId:who.memberId,status:'PENDING'},data:{status:'FAILED',failureReason:'Could not initiate hosted checkout'}}));
      throw new ServiceUnavailableException('Checkout is temporarily unavailable');
    }
  }
  async callback(dto:GatewayCallbackDto,signature:string) {
    const secret=process.env.MEMBER_PAYMENT_GATEWAY_SECRET;if(!secret||Math.abs(Date.now()-dto.timestamp)>300000)throw new UnauthorizedException('Invalid callback');
    const canonical=[dto.paymentId,dto.gymId,dto.status,dto.amount,dto.currency,dto.reference,dto.timestamp].join('|');
    const expected=createHmac('sha256',secret).update(canonical).digest('hex');
    if(!/^[a-f0-9]{64}$/.test(signature||'')||!timingSafeEqual(Buffer.from(expected),Buffer.from(signature)))throw new UnauthorizedException('Invalid callback signature');
    return this.tenant.runWithTenantRLS(dto.gymId,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dto.paymentId}))`;
      const payment=await tx.payment.findFirst({where:{id:dto.paymentId,gymId:dto.gymId,providerReference:dto.reference}});
      if(!payment||payment.amount!==dto.amount||payment.currency!==dto.currency||(payment.paymentMethodDetails as any)?.kind!=='MEMBER_RENEWAL')throw new BadRequestException('Payment verification failed');
      if(payment.status!=='PENDING')return {received:true};
      await tx.payment.update({where:{id:payment.id},data:{status:dto.status,paidAt:dto.status==='COMPLETED'?new Date():null}});
      if(dto.status==='COMPLETED'&&payment.membershipId) {
        const membership=await tx.membership.findFirstOrThrow({where:{id:payment.membershipId,gymId:dto.gymId,memberId:payment.memberId}});
        if(membership.status==='CANCELLED')throw new BadRequestException('Membership was cancelled; contact the gym for reconciliation');
        const months={MONTHLY:1,QUARTERLY:3,BIANNUAL:6,ANNUAL:12,SESSION_PASS:1}[membership.planType];
        const base=membership.endDate>new Date()?membership.endDate:new Date();
        await tx.membership.update({where:{id:membership.id},data:{status:'ACTIVE',endDate:addMonths(base,months)}});
        await tx.member.updateMany({where:{id:payment.memberId,gymId:dto.gymId,status:'INACTIVE'},data:{status:'ACTIVE'}});
      }
      return {received:true};
    });
  }
}
