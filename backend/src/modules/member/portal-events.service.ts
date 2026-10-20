import { Injectable, MessageEvent } from '@nestjs/common';
import { Observable, timer } from 'rxjs';
import { exhaustMap, takeUntil } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { MemberPrismaService } from '../../prisma/member-prisma.service';
import { TenantPrismaService } from '../../prisma/tenant-prisma.service';
import { MemberIdentity } from '../auth/member-identity';

@Injectable()
export class PortalEventsService {
 constructor(private readonly members:MemberPrismaService,private readonly tenant:TenantPrismaService) {}
 stream(identity:MemberIdentity|{gymId:string;exp?:number},lastId?:string):Observable<MessageEvent> {
  let cursor=/^\d{1,20}$/.test(lastId||'')?BigInt(lastId):null;
  const query=<T>(fn:(tx:Prisma.TransactionClient)=>Promise<T>)=>'memberId' in identity?this.members.run(identity,fn):this.tenant.runWithTenantRLS(identity.gymId,fn);
  return timer(0,1000).pipe(exhaustMap(async()=>{
   const rows=await query(tx=>tx.portalEvent.findMany({where:{gymId:identity.gymId,...(cursor===null?{}:{id:{gt:cursor}})},orderBy:{id:cursor===null?'desc':'asc'},take:cursor===null?1:100,select:{id:true,kind:true}}));
   const starting=cursor===null;
   if(rows.length)cursor=rows[rows.length-1].id;
   if(cursor===null)cursor=0n;
   return {id:cursor.toString(),type:'change',data:{changed:!starting&&rows.length>0,kinds:starting?[]:Array.from(new Set(rows.map(row=>row.kind)))}} as MessageEvent;
  }),takeUntil(timer(Math.max(1,Math.min(30*60_000,((identity as any).exp||Math.floor(Date.now()/1000)+1800)*1000-Date.now())))));
 }
}
