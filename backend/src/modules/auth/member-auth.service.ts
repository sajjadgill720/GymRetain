import { Injectable, HttpException, NotFoundException, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomInt, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { digest, memberSecret, normalizePhone, sameDigest } from './member-identity';
import { RequestMemberOtpDto, VerifyMemberOtpDto } from './dto/member-auth.dto';

@Injectable()
export class MemberAuthService {
  constructor(private readonly prisma:PrismaService,private readonly tenant:TenantPrismaService,private readonly jwt:JwtService) {}

  // This SELECT policy exposes only the requested public gym, inside this transaction.
  async publicGym(slug:string) {
    return this.prisma.$transaction(async tx=>{
      await tx.$executeRaw`SELECT set_config('app.public_gym_slug',${slug},true)`;
      const gym=await tx.gym.findFirst({where:{slug,status:{in:['ACTIVE','TRIAL']}},select:{id:true,name:true,slug:true,timezone:true}});
      if(!gym)throw new NotFoundException('Gym not found');
      return gym;
    });
  }

  async limit(gymId:string,key:string,limit:number,windowMs:number) {
    const window=Math.floor(Date.now()/windowMs);
    const id=digest(`${gymId}:${key}:${window}`);
    const record=await this.tenant.runWithTenantRLS(gymId,tx=>tx.portalRateLimit.upsert({where:{id},create:{id,gymId,count:1,expiresAt:new Date((window+1)*windowMs)},update:{count:{increment:1}}}));
    if(record.count>limit)throw new HttpException('Too many attempts. Please try again later.',429);
  }

  async request(dto:RequestMemberOtpDto,ip:string) {
    const gym=await this.publicGym(dto.gymSlug);const phone=normalizePhone(dto.phone);
    await this.limit(gym.id,`ip:${ip}`,20,15*60_000);
    await this.limit(gym.id,`phone:${phone}`,3,15*60_000);
    const id=randomUUID();const code=randomInt(0,1_000_000).toString().padStart(6,'0');
    const candidates=await this.tenant.runWithTenantRLS(gym.id,tx=>tx.member.findMany({where:{gymId:gym.id,phone},select:{id:true},take:2}));
    const member=candidates.length===1?candidates[0]:null;
    await this.tenant.runWithTenantRLS(gym.id,async tx=>{
      // Serialize requests to invalidate older codes even across application instances.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${gym.id}:${phone}`}))`;
      await tx.memberOtp.updateMany({where:{gymId:gym.id,phoneHash:digest(phone),consumedAt:null},data:{consumedAt:new Date()}});
      await tx.memberOtp.create({data:{id,gymId:gym.id,memberId:member?.id,phoneHash:digest(phone),codeHash:digest(`${id}:${code}`),expiresAt:new Date(Date.now()+300_000)}});
    });
    const dev=process.env.NODE_ENV!=='production'&&process.env.MEMBER_DEV_OTP==='true';
    if(member&&!dev) {
      try { await this.deliver(phone,code,dto.channel); }
      catch { await this.tenant.runWithTenantRLS(gym.id,tx=>tx.memberOtp.updateMany({where:{id,gymId:gym.id},data:{consumedAt:new Date()}})); }
    }
    // Same response for unknown phones and delivery failures, with no existence disclosure.
    return {requestId:id,expiresIn:300,message:'If this phone is registered, a code will arrive shortly.',...(dev&&member?{developmentCode:code}:{})};
  }

  private async deliver(phone:string,code:string,channel:'sms'|'whatsapp') {
    const sid=process.env.TWILIO_ACCOUNT_SID, secret=process.env.TWILIO_AUTH_TOKEN;
    const from=channel==='whatsapp'?process.env.TWILIO_WHATSAPP_NUMBER:process.env.TWILIO_SMS_NUMBER;
    if(!sid||!secret||!from)throw new ServiceUnavailableException('OTP delivery is not configured');
    const prefix=channel==='whatsapp'?'whatsapp:':'';
    const body=new URLSearchParams({From:`${prefix}${from.replace(/^whatsapp:/,'')}`,To:`${prefix}${phone}`});
    if(channel==='whatsapp') {
      if(!process.env.TWILIO_OTP_CONTENT_SID)throw new ServiceUnavailableException('Authentication template is not configured');
      body.set('ContentSid',process.env.TWILIO_OTP_CONTENT_SID);body.set('ContentVariables',JSON.stringify({'1':code}));
    } else body.set('Body',`Your GymRetain code is ${code}. It expires in 5 minutes. Do not share it.`);
    const res=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${sid}:${secret}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body:body.toString(),signal:AbortSignal.timeout(10_000)});
    if(!res.ok)throw new ServiceUnavailableException('OTP delivery failed');
  }

  async verify(dto:VerifyMemberOtpDto,ip:string) {
    const gym=await this.publicGym(dto.gymSlug);
    await this.limit(gym.id,`verify:${ip}`,30,15*60_000);
    const member=await this.tenant.runWithTenantRLS(gym.id,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${dto.requestId}))`;
      const otp=await tx.memberOtp.findFirst({where:{id:dto.requestId,gymId:gym.id}});
      if(!otp||otp.consumedAt||otp.expiresAt.getTime()<=Date.now()||otp.attempts>=5)return null;
      await tx.memberOtp.update({where:{id:otp.id},data:{attempts:{increment:1}}});
      if(!sameDigest(otp.codeHash,digest(`${otp.id}:${dto.code}`))||!otp.memberId)return null;
      const member=await tx.member.findFirst({where:{id:otp.memberId,gymId:gym.id},select:{id:true,firstName:true,lastName:true}});
      if(!member)return null;
      await tx.memberOtp.update({where:{id:otp.id},data:{consumedAt:new Date()}});
      return member;
    });
    // Throw outside the transaction so failed-attempt increments are committed.
    if(!member)throw new UnauthorizedException('Code is invalid or expired');
    const token=this.jwt.sign({sub:member.id,memberId:member.id,gymId:gym.id,role:'MEMBER'},{secret:memberSecret('JWT'),audience:'gymretain-member',issuer:'gymretain',expiresIn:'12h'});
    return {token,member,gym};
  }
}
