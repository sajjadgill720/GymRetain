import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TenantPrismaService } from './tenant-prisma.service';
import { SuperAdminPrismaService } from './super-admin-prisma.service';

@Global()
@Module({
  providers: [PrismaService, TenantPrismaService, SuperAdminPrismaService],
  exports: [PrismaService, TenantPrismaService, SuperAdminPrismaService],
})
export class PrismaModule {}
