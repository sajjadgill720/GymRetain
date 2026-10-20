import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
const prisma=new PrismaClient();
function id(key:string) {const hex=createHash('md5').update(`gymretain-portal:${key}`).digest('hex');return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;}
async function main() {
 if(process.env.NODE_ENV==='production')throw new Error('Portal preview seeding is for non-production environments only');
 const gyms=await prisma.gym.findMany({where:{status:{in:['ACTIVE','TRIAL']}},select:{id:true}});
 for(const gym of gyms)await prisma.$transaction(async tx=>{
  await tx.$executeRaw`SELECT set_config('app.current_gym_id',${gym.id},true),set_config('app.is_super_admin','false',true)`;
  await tx.$queryRaw`SELECT id FROM gyms WHERE id=${gym.id}::uuid FOR UPDATE`;
  const member=await tx.member.findFirst({where:{gymId:gym.id,status:'ACTIVE'},orderBy:{createdAt:'asc'}});if(!member)return;
  await tx.memberProfile.upsert({where:{memberId:member.id},create:{gymId:gym.id,memberId:member.id,goal:'Build strength and a consistent routine',weeklyTarget:3,onboarded:false},update:{}});
  await tx.workoutLog.upsert({where:{id:id(`${member.id}-workout`)},create:{id:id(`${member.id}-workout`),gymId:gym.id,memberId:member.id,title:'Full body foundations',minutes:45,notes:'A steady start. Focused on form.'},update:{}});
  await tx.personalRecord.upsert({where:{id:id(`${member.id}-record`)},create:{id:id(`${member.id}-record`),gymId:gym.id,memberId:member.id,exercise:'Goblet squat',weightKg:16,reps:10},update:{}});
  await tx.announcement.upsert({where:{id:id(`${gym.id}-announcement`)},create:{id:id(`${gym.id}-announcement`),gymId:gym.id,title:'Welcome to your member space',body:'Your gym pass, progress and classes are now together. Ask reception if you need a hand.'},update:{}});
  const row=await tx.gym.findUniqueOrThrow({where:{id:gym.id},select:{settings:true}});const settings=(row.settings as any)||{};const ops=settings.operations||{version:0,leads:[],sessions:[],expenses:[],tasks:[]};
  if(!ops.sessions.some((s:any)=>s.id===id(`${gym.id}-class`))) {
   ops.sessions.push({id:id(`${gym.id}-class`),title:'Strength foundations',coach:'Gym coaching team',startsAt:new Date(Date.now()+86400000).toISOString(),duration:45,capacity:12,attendees:[],status:'SCHEDULED'});ops.version++;
   await tx.gym.update({where:{id:gym.id},data:{settings:{...settings,operations:ops}}});
  }
 });
 console.log('Portal examples added without deleting or resetting existing data.');
}
main().finally(()=>prisma.$disconnect());
