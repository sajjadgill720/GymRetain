import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as webpush from 'web-push';
import { MemberPrismaService } from '../../prisma/member-prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { MemberIdentity } from '../auth/member-identity';
import { PushDto } from './member.dto';

@Injectable()
export class MemberPushService {
 constructor(private readonly members:MemberPrismaService,private readonly tenant:TenantPrismaService) {}
 config() {return {publicKey:process.env.WEB_PUSH_PUBLIC_KEY||null};}
 async subscribe(who:MemberIdentity,dto:PushDto) {
  if(!process.env.WEB_PUSH_PUBLIC_KEY||!process.env.WEB_PUSH_PRIVATE_KEY)throw new ServiceUnavailableException('Push notifications are not configured');
  const url=new URL(dto.endpoint);
  // Prevent subscription endpoints becoming arbitrary internal HTTP targets.
  if(url.protocol!=='https:'||url.username||url.password||url.port||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns2-pn1p.notify.windows.com'].some(host=>url.hostname===host||url.hostname.endsWith('.'+host)))throw new BadRequestException('Unsupported push service');
  return this.members.run(who,async tx=>{
   await tx.pushSubscription.deleteMany({where:{gymId:who.gymId,memberId:who.memberId,endpoint:dto.endpoint}});
   await tx.pushSubscription.create({data:{gymId:who.gymId,memberId:who.memberId,endpoint:dto.endpoint,p256dh:dto.keys.p256dh,auth:dto.keys.auth}});return {subscribed:true};
  });
 }
 unsubscribe(who:MemberIdentity) {return this.members.run(who,tx=>tx.pushSubscription.deleteMany({where:{gymId:who.gymId,memberId:who.memberId}}));}
 async broadcast(gymId:string,title:string,body:string) {
  const publicKey=process.env.WEB_PUSH_PUBLIC_KEY,privateKey=process.env.WEB_PUSH_PRIVATE_KEY;
  if(!publicKey||!privateKey)return {attempted:0,delivered:0};
  const subscriptions=await this.tenant.runWithTenantRLS(gymId,tx=>tx.pushSubscription.findMany({where:{gymId,member:{portalProfile:{notifications:true}}},take:5000}));
  let delivered=0;
  for(let offset=0;offset<subscriptions.length;offset+=20)await Promise.all(subscriptions.slice(offset,offset+20).map(async subscription=>{
   try{await webpush.sendNotification({endpoint:subscription.endpoint,keys:{p256dh:subscription.p256dh,auth:subscription.auth}},JSON.stringify({title:'An update from your gym',body:'Open GymRetain to read your latest announcement.'}),{vapidDetails:{subject:process.env.WEB_PUSH_SUBJECT||'mailto:support@gymretain.pk',publicKey,privateKey},TTL:3600,timeout:5000});delivered++;}
   catch(error){if([404,410].includes(error.statusCode))await this.tenant.runWithTenantRLS(gymId,tx=>tx.pushSubscription.deleteMany({where:{id:subscription.id,gymId}}));}
  }));return {attempted:subscriptions.length,delivered};
 }
}
