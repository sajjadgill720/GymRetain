import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantPrismaService } from './tenant-prisma.service';
import { assertMember, MemberIdentity } from '../modules/auth/member-identity';

@Injectable()
export class MemberPrismaService {
  constructor(private readonly tenant:TenantPrismaService) {}
  run<T>(identity:MemberIdentity, operation:(tx:Prisma.TransactionClient)=>Promise<T>) {
    assertMember(identity);
    return this.tenant.runWithTenantRLS(identity.gymId,async tx=>{
      await tx.$executeRaw`SELECT set_config('app.current_member_id',${identity.memberId},true)`;
      // RLS must still apply when a local installation uses a superuser DB URL.
      await tx.$executeRaw`SET LOCAL ROLE gymretain_member_runtime`;
      return operation(tx);
    });
  }
}
