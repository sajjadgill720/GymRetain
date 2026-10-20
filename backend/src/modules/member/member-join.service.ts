import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { addMonths } from 'date-fns';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { MemberAuthService } from '../auth/member-auth.service';
import { normalizePhone } from '../auth/member-identity';
import { JoinDto } from './member.dto';

@Injectable()
export class MemberJoinService {
  constructor(private readonly auth:MemberAuthService,private readonly tenant:TenantPrismaService) {}
  async join(slug:string,dto:JoinDto,ip:string) {
    const gym=await this.auth.publicGym(slug);const phone=normalizePhone(dto.phone);
    await this.auth.limit(gym.id,`join:${ip}`,5,900000);
    await this.tenant.runWithTenantRLS(gym.id,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${gym.id}:${phone}`}))`;
      const existing=await tx.member.findFirst({where:{gymId:gym.id,phone},select:{id:true}});if(existing)return;
      const member=await tx.member.create({data:{gymId:gym.id,firstName:dto.firstName.trim(),lastName:dto.lastName.trim(),phone,memberCode:`JOIN-${randomUUID().slice(0,12)}`,status:'INACTIVE'}});
      await tx.membership.create({data:{gymId:gym.id,memberId:member.id,planName:'Awaiting plan assignment',planType:'MONTHLY',price:0,status:'PENDING_PAYMENT',startDate:new Date(),endDate:addMonths(new Date(),1)}});
    });
    return {message:'Your request is with the gym. Continue with your phone number to sign in.'};
  }
}
