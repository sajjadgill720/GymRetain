import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { MemberPrismaService } from '../../prisma/member-prisma.service';
import { MemberIdentity } from '../auth/member-identity';
import { ProfileDto, WorkoutDto, RecordDto, MeasurementDto, RequestDto, MealDto } from './member.dto';
import { getLocalDayBoundsUtc } from '../../common/utils/timezone.util';

@Injectable()
export class MemberService {
  constructor(private readonly db:MemberPrismaService) {}
  private scope(who:MemberIdentity) { return {gymId:who.gymId,memberId:who.memberId}; }
  async overview(who:MemberIdentity) {
    return this.db.run(who,async tx=>{
      const scope=this.scope(who);
      const member=await tx.member.findFirst({where:{id:who.memberId,gymId:who.gymId},select:{id:true,firstName:true,lastName:true,phone:true,email:true,memberCode:true,status:true}});
      if(!member)throw new NotFoundException('Member not found');
      const gym=await tx.gym.findFirstOrThrow({where:{id:who.gymId},select:{name:true,timezone:true,capacity:true,settings:true}});
      const profile=await tx.memberProfile.upsert({where:{memberId:who.memberId},create:scope,update:{}});
      const [streak,visits,membership,rewards,bookings,diet,workouts,records,measurements,requests,announcements,trainer]=await Promise.all([
        tx.streak.findFirst({where:scope}),tx.checkIn.findMany({where:scope,select:{checkInDate:true,checkInTime:true},orderBy:{checkInTime:'desc'},take:365}),
        tx.membership.findFirst({where:{...scope,status:{not:'CANCELLED'}},orderBy:{createdAt:'desc'}}),
        tx.rewardRedemption.findMany({where:scope,include:{reward:true},orderBy:{unlockedAt:'desc'},take:100}),
        tx.classBooking.findMany({where:{...scope,status:{in:['BOOKED','WAITLISTED']}},orderBy:{createdAt:'asc'},take:100}),
        tx.dietPlan.findFirst({where:{...scope,isActive:true},include:{meals:{orderBy:{orderIndex:'asc'}}},orderBy:{createdAt:'desc'}}),
        tx.workoutLog.findMany({where:scope,orderBy:{loggedAt:'desc'},take:50}),tx.personalRecord.findMany({where:scope,orderBy:{loggedAt:'desc'},take:50}),
        tx.measurement.findMany({where:scope,orderBy:{loggedAt:'desc'},take:50}),tx.memberRequest.findMany({where:scope,orderBy:{createdAt:'desc'},take:50}),
        tx.announcement.findMany({where:{gymId:who.gymId},orderBy:{createdAt:'desc'},take:20}),
        tx.trainerAssignment.findFirst({where:{...scope,isActive:true},select:{trainer:{select:{id:true,name:true,specialties:true,bio:true}}}}),
      ]);
      const rewardRules=await tx.reward.findMany({where:{gymId:who.gymId,isActive:true},orderBy:{triggerThreshold:'asc'}});
      const payments=await tx.payment.findMany({where:scope,orderBy:{createdAt:'desc'},take:50});
      // Occupancy is aggregate-only: no member names/IDs leave the security-definer function.
      const rows=await tx.$queryRaw<{count:number}[]>`SELECT portal_occupancy(${who.gymId}::uuid)::int AS count`;
      const settings=gym.settings as any;const sessions=(settings?.operations?.sessions||[]).filter((s:any)=>s.status==='SCHEDULED').map((s:any)=>({id:s.id,title:s.title,coach:s.coach,startsAt:s.startsAt,duration:s.duration,capacity:s.capacity,spotsLeft:Math.max(0,s.capacity-(s.attendees?.length||0)),booking:bookings.find(b=>b.sessionId===s.id)?.status||null}));
      const today=getLocalDayBoundsUtc(gym.timezone,new Date()).dateStr;
      const todayDate=new Date(`${today}T00:00:00Z`);const monday=new Date(todayDate);monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
      const weeklyVisits=new Set(visits.filter(v=>new Date(v.checkInDate)>=monday).map(v=>new Date(v.checkInDate).toISOString().slice(0,10))).size;
      const attendanceWeeks=Array.from({length:8},(_,index)=>{const start=new Date(monday);start.setUTCDate(start.getUTCDate()-(7-index)*7);const end=new Date(start);end.setUTCDate(end.getUTCDate()+7);return {label:start.toISOString().slice(0,10),visits:new Set(visits.filter(v=>new Date(v.checkInDate)>=start&&new Date(v.checkInDate)<end).map(v=>new Date(v.checkInDate).toISOString().slice(0,10))).size};});
      const totalVisits=await tx.checkIn.count({where:scope});
      const spent=rewards.filter(r=>r.status==='REDEEMED').reduce((sum,r)=>sum+r.reward.pointsCost,0);
      return {onlinePaymentsAvailable:!!(process.env.MEMBER_PAYMENT_GATEWAY_URL&&process.env.MEMBER_PAYMENT_GATEWAY_SECRET),member,gym:{name:gym.name,timezone:gym.timezone,capacity:gym.capacity,insideNow:rows[0]?.count||0},profile,streak,weeklyVisits,attendanceWeeks,totalVisits,points:Math.max(0,totalVisits*10-spent),membership,rewards,rewardRules,classes:sessions,bookings,diet,workouts,records,measurements,requests,announcements,trainer:trainer?.trainer||null,payments,today};
    });
  }
  profile(who:MemberIdentity,dto:ProfileDto) {
    return this.db.run(who,async tx=>{
      const {firstName,lastName,...profile}=dto;
      if(firstName!==undefined||lastName!==undefined)await tx.member.updateMany({where:{id:who.memberId,gymId:who.gymId},data:{firstName,lastName}});
      return tx.memberProfile.upsert({where:{memberId:who.memberId},create:{...this.scope(who),...profile},update:profile});
    });
  }
  workout(who:MemberIdentity,dto:WorkoutDto) {return this.db.run(who,tx=>tx.workoutLog.create({data:{...dto,...this.scope(who)}}));}
  record(who:MemberIdentity,dto:RecordDto) {return this.db.run(who,tx=>tx.personalRecord.create({data:{...dto,...this.scope(who)}}));}
  measurement(who:MemberIdentity,dto:MeasurementDto) {return this.db.run(who,tx=>tx.measurement.create({data:{...dto,...this.scope(who)}}));}
  request(who:MemberIdentity,dto:RequestDto) {return this.db.run(who,tx=>tx.memberRequest.create({data:{...dto,...this.scope(who)}}));}
  async meal(who:MemberIdentity,dto:MealDto) {
    return this.db.run(who,async tx=>{
      const plan=await tx.dietPlan.findFirst({where:{...this.scope(who),isActive:true,meals:{some:{id:dto.mealId}}},select:{id:true}});
      if(!plan)throw new NotFoundException('Meal not found in your assigned plan');
      const gym=await tx.gym.findFirstOrThrow({where:{id:who.gymId},select:{timezone:true}});const today=getLocalDayBoundsUtc(gym.timezone,new Date()).dateStr;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${who.memberId}))`;
      const profile=await tx.memberProfile.upsert({where:{memberId:who.memberId},create:this.scope(who),update:{}});
      const checklist=profile.mealChecklist as any;const current=checklist.date===today?checklist.checked||{}:{};
      return tx.memberProfile.update({where:{memberId:who.memberId},data:{mealChecklist:{date:today,checked:{...current,[dto.mealId]:dto.checked}}}});
    });
  }
  async freeze(who:MemberIdentity) {
    return this.db.run(who,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${who.memberId}))`;
      const streak=await tx.streak.findFirst({where:this.scope(who)});const gym=await tx.gym.findFirstOrThrow({where:{id:who.gymId},select:{timezone:true}});
      const date=getLocalDayBoundsUtc(gym.timezone,new Date()).dateStr;
      const profile=await tx.memberProfile.upsert({where:{memberId:who.memberId},create:this.scope(who),update:{}});
      if(profile.freezeUsedOn?.toISOString().slice(0,10)===date)throw new ConflictException('A freeze is already active today');
      if(!streak||streak.streakFreezeAvailable<1)throw new BadRequestException('No streak freezes available');
      // Protect the existing streak for one missed day without awarding a visit or points.
      const today=new Date(`${date}T00:00:00Z`);
      if(!streak.lastCheckInDate||today.getTime()-streak.lastCheckInDate.getTime()>2*86400000)throw new BadRequestException('A freeze can protect only one missed day');
      await tx.streak.updateMany({where:{...this.scope(who),streakFreezeAvailable:{gt:0}},data:{streakFreezeAvailable:{decrement:1},lastCheckInDate:today}});
      return tx.memberProfile.update({where:{memberId:who.memberId},data:{freezeUsedOn:today}});
    });
  }
  async redeem(who:MemberIdentity,rewardId:string) {
    return this.db.run(who,async tx=>{
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${who.memberId}))`;
      const scope=this.scope(who);const reward=await tx.reward.findFirst({where:{id:rewardId,gymId:who.gymId,isActive:true}});
      if(!reward)throw new NotFoundException('Reward unavailable');
      const redemption=await tx.rewardRedemption.findFirst({where:{...scope,rewardId}});
      if(!redemption||redemption.status!=='UNLOCKED')throw new BadRequestException('This reward is not available to redeem');
      const [visits,spent]=await Promise.all([tx.checkIn.count({where:scope}),tx.rewardRedemption.findMany({where:{...scope,status:'REDEEMED'},include:{reward:true}})]);
      const points=visits*10-spent.reduce((sum,r)=>sum+r.reward.pointsCost,0);
      if(points<reward.pointsCost)throw new BadRequestException('Not enough points');
      return tx.rewardRedemption.updateMany({where:{id:redemption.id,...scope,status:'UNLOCKED'},data:{status:'REDEEMED',redeemedAt:new Date()}});
    });
  }
  book(who:MemberIdentity,sessionId:string,cancel=false) {
    return this.db.run(who,tx=>tx.$queryRaw`SELECT * FROM portal_book_class(${who.gymId}::uuid,${who.memberId}::uuid,${sessionId}::uuid,${cancel})`);
  }
  async messages(who:MemberIdentity,content?:string) {
    return this.db.run(who,async tx=>{
      const scope=this.scope(who);const assignment=await tx.trainerAssignment.findFirst({where:{...scope,isActive:true},select:{trainerId:true}});
      if(!assignment)throw new BadRequestException('No trainer assigned');
      if(content)return tx.trainerMessage.create({data:{...scope,trainerId:assignment.trainerId,sender:'MEMBER',content}});
      return tx.trainerMessage.findMany({where:{...scope,trainerId:assignment.trainerId},orderBy:{createdAt:'asc'},take:200});
    });
  }
}
