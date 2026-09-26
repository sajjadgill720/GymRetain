import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Prisma } from '@prisma/client';

/**
 * TenantPrismaService implements the Dual-Layer Multi-Tenant Isolation Architecture:
 *
 * Layer 1 (Application-Level Scoping):
 * Automatically scopes queries and inserts by injecting the tenant's gymId.
 *
 * Layer 2 (Postgres RLS Hard Backstop):
 * Executes operations inside a transaction block where session variables:
 *   SET LOCAL app.current_gym_id = '<gymId>';
 *   SET LOCAL app.is_super_admin = 'false';
 * are set. If application scoping ever has a bug or raw SQL is run, PostgreSQL's
 * Row-Level Security engine guarantees 0 cross-tenant data leakage.
 */
@Injectable()
export class TenantPrismaService {
  private readonly logger = new Logger(TenantPrismaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Execute an operation inside a PostgreSQL transaction with tenant session variables set.
   * This activates PostgreSQL Row-Level Security policies for the current gym.
   */
  async runWithTenantRLS<T>(
    gymId: string,
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    if (!gymId) {
      throw new BadRequestException('gymId is required to execute tenant-scoped queries');
    }

    return this.prisma.$transaction(async (tx) => {
      // Set PostgreSQL session variables locally for this transaction
      await tx.$executeRawUnsafe(`SET LOCAL app.current_gym_id = '${gymId}';`);
      await tx.$executeRawUnsafe(`SET LOCAL app.is_super_admin = 'false';`);

      return operation(tx);
    });
  }

  /**
   * Creates a tenant-scoped extended Prisma Client for a given gym.
   * Injects gymId into all tenant-owned model queries (Layer 1).
   */
  forTenant(gymId: string) {
    if (!gymId) {
      throw new BadRequestException('gymId is required for tenant context');
    }

    const tenantGymId = gymId;

    return this.prisma.$extends({
      name: `TenantScope-${tenantGymId}`,
      query: {
        member: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async create({ args, query }) {
            args.data = { ...args.data, gymId: tenantGymId } as any;
            return query(args);
          },
          async updateMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async deleteMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
        },
        membership: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async create({ args, query }) {
            args.data = { ...args.data, gymId: tenantGymId } as any;
            return query(args);
          },
        },
        checkIn: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async create({ args, query }) {
            args.data = { ...args.data, gymId: tenantGymId } as any;
            return query(args);
          },
        },
        streak: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
        },
        reward: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async create({ args, query }) {
            args.data = { ...args.data, gymId: tenantGymId } as any;
            return query(args);
          },
        },
        rewardRedemption: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
        },
        payment: {
          async findMany({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async findFirst({ args, query }) {
            args.where = { ...args.where, gymId: tenantGymId };
            return query(args);
          },
          async create({ args, query }) {
            args.data = { ...args.data, gymId: tenantGymId } as any;
            return query(args);
          },
        },
      },
    });
  }
}
