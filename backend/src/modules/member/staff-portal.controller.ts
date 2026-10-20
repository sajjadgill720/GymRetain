import { Body, Controller, ForbiddenException, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Req, Sse, UseGuards } from '@nestjs/common';
import { CurrentGymId } from '../../common/decorators/current-gym.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantAccessGuard } from '../../common/guards/tenant-access.guard';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { AnnouncementDto, MessageDto } from './member.dto';
import { MemberPushService } from './member-push.service';
import { PortalEventsService } from './portal-events.service';
import * as QRCode from 'qrcode';

@Controller('staff/member-portal')
@UseGuards(TenantAccessGuard,RolesGuard)
@Roles('GYM_OWNER','GYM_MANAGER','GYM_STAFF','TRAINER')
export class StaffPortalController {
 constructor(private readonly tenant:TenantPrismaService,private readonly push:MemberPushService,private readonly events:PortalEventsService) {}
 @Sse('events') eventsStream(@CurrentGymId() gymId:string,@Req() req:any,@Headers('last-event-id') lastId:string) {return this.events.stream({gymId,exp:req.user.exp},lastId);}
 @Get('join-pass') async joinPass(@CurrentGymId() gymId:string) {
  const gym=await this.tenant.runWithTenantRLS(gymId,tx=>tx.gym.findFirstOrThrow({where:{id:gymId},select:{slug:true}}));
  const url=`${process.env.PORTAL_PUBLIC_URL||'http://localhost:3001'}/portal/join/${encodeURIComponent(gym.slug)}`;
  return {url,qrImage:await QRCode.toDataURL(url,{width:320,margin:3,color:{dark:'#24392E',light:'#FFFEFA'}})};
 }
 @Get('inbox') inbox(@CurrentGymId() gymId:string,@Req() req:any) {
  return this.tenant.runWithTenantRLS(gymId,async tx=>{
   const trainer=req.user.role==='TRAINER'?await tx.trainer.findFirst({where:{gymId,staffId:req.user.sub,isActive:true,isArchived:false},select:{id:true}}):null;
   if(req.user.role==='TRAINER'&&!trainer)throw new ForbiddenException('Trainer profile not found');
   const allowed=trainer?{trainerAssignments:{some:{gymId,trainerId:trainer.id,isActive:true}}}:{};
   const [requests,messages,announcements]=await Promise.all([
    tx.memberRequest.findMany({where:{gymId,member:allowed},include:{member:{select:{id:true,firstName:true,lastName:true,memberCode:true}}},orderBy:{createdAt:'desc'},take:100}),
    tx.trainerMessage.findMany({where:{gymId,...(trainer?{trainerId:trainer.id,member:allowed}:{})},include:{member:{select:{id:true,firstName:true,lastName:true}},trainer:{select:{id:true,name:true}}},orderBy:{createdAt:'desc'},take:200}),
    tx.announcement.findMany({where:{gymId},orderBy:{createdAt:'desc'},take:20}),
   ]);
   return {requests,messages,announcements};
  });
 }
 @Post('announcements') @Roles('GYM_OWNER','GYM_MANAGER')
 async announce(@CurrentGymId() gymId:string,@Body() dto:AnnouncementDto) {
  const announcement=await this.tenant.runWithTenantRLS(gymId,tx=>tx.announcement.create({data:{gymId,...dto}}));
  // Do not let delivery failures roll back an already published in-app announcement.
  const push=await this.push.broadcast(gymId,dto.title,dto.body).catch(()=>({attempted:0,delivered:0}));
  return {announcement,push};
 }
 private async authorizeMember(tx:any,gymId:string,memberId:string,actor:any) {
  const member=await tx.member.findFirst({where:{id:memberId,gymId},select:{id:true}});if(!member)throw new ForbiddenException('Member is not in your gym');
  const assignment=await tx.trainerAssignment.findFirst({where:{gymId,memberId,isActive:true},include:{trainer:true}});
  if(actor.role==='TRAINER'&&assignment?.trainer.staffId!==actor.sub)throw new ForbiddenException('Member is not assigned to you');
  return assignment;
 }
 @Post('members/:id/messages') @Roles('GYM_OWNER','GYM_MANAGER','TRAINER')
 message(@CurrentGymId() gymId:string,@Param('id',ParseUUIDPipe) memberId:string,@Req() req:any,@Body() dto:MessageDto) {
  return this.tenant.runWithTenantRLS(gymId,async tx=>{
   const assignment=await this.authorizeMember(tx,gymId,memberId,req.user);if(!assignment)throw new ForbiddenException('Assign a trainer before replying');
   return tx.trainerMessage.create({data:{gymId,memberId,trainerId:assignment.trainerId,sender:'TRAINER',content:dto.content}});
  });
 }
 @Post('members/:id/workout') @Roles('GYM_OWNER','GYM_MANAGER','TRAINER')
 workout(@CurrentGymId() gymId:string,@Param('id',ParseUUIDPipe) memberId:string,@Req() req:any,@Body() dto:MessageDto) {
  return this.tenant.runWithTenantRLS(gymId,async tx=>{await this.authorizeMember(tx,gymId,memberId,req.user);return tx.memberRequest.create({data:{gymId,memberId,kind:'WORKOUT_PLAN',message:dto.content,status:'ASSIGNED'}});});
 }
 @Patch('requests/:id/resolve') @Roles('GYM_OWNER','GYM_MANAGER','TRAINER')
 resolve(@CurrentGymId() gymId:string,@Param('id',ParseUUIDPipe) id:string,@Req() req:any) {
  return this.tenant.runWithTenantRLS(gymId,async tx=>{const request=await tx.memberRequest.findFirst({where:{id,gymId},select:{memberId:true}});if(!request)throw new ForbiddenException('Request not in your gym');await this.authorizeMember(tx,gymId,request.memberId,req.user);return tx.memberRequest.updateMany({where:{id,gymId},data:{status:'RESOLVED'}});});
 }
}
