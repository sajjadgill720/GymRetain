import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditContext {
  staffId: string;
  actorRole: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * SuperAdminPrismaService:
 * Dedicated, strictly audited code path for platform Super Admins.
 * Never shared or accessible by tenant-scoped users.
 */
@Injectable()
export class SuperAdminPrismaService {
  private readonly logger = new Logger(SuperAdminPrismaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute an audited cross-tenant aggregation or admin operation.
   * Logs the audit record inside the database before bypassing tenant RLS.
   */
  async runAuditedCrossTenantQuery<T>(
    audit: AuditContext,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (audit.actorRole !== 'SUPER_ADMIN') {
      throw new UnauthorizedException(
        'Access denied: Only SUPER_ADMIN is permitted to access the cross-tenant query path',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Immutable Audit Log Entry
      await tx.auditLog.create({
        data: {
          staffId: audit.staffId,
          actorRole: audit.actorRole,
          action: audit.action,
          resource: audit.resource,
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
          metadata: audit.metadata ? (audit.metadata as any) : undefined,
        },
      });

      // 2. Set Super Admin bypass flag for PostgreSQL RLS within this transaction
      await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'true';`);
      await tx.$executeRawUnsafe(`SET LOCAL app.current_gym_id = '';`);

      this.logger.warn(
        `SUPER_ADMIN audit event recorded: action="${audit.action}", resource="${audit.resource}", actor="${audit.staffId}"`,
      );

      // 3. Execute the cross-tenant operation
      return operation(tx);
    });
  }
}
