import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TenantContext } from '../interfaces/tenant-context.interface';

@Injectable()
export class TenantAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('Tenant access denied: unauthenticated request');
    }

    // Super Admin has platform-wide access, but when accessing tenant endpoints
    // they can either pass a target gymId header or view super-admin audit endpoints
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    let resolvedGymId = user.gymId;

    if (isSuperAdmin) {
      // Super admin can specify target tenant via header or route parameter
      const headerGymId = request.headers['x-gym-id'] as string;
      const paramGymId = request.params?.gymId as string;
      resolvedGymId = headerGymId || paramGymId || user.gymId;
    } else {
      // Gym staff or gym owner MUST have a gymId bound to their identity
      if (!user.gymId) {
        throw new ForbiddenException('Tenant access denied: user is not assigned to a gym');
      }

      // If a gymId is in the route parameters, it MUST match the user's gymId
      const paramGymId = request.params?.gymId as string;
      if (paramGymId && paramGymId !== user.gymId) {
        throw new ForbiddenException(
          'Tenant access denied: cross-tenant access violation detected',
        );
      }
    }

    // Attach verified TenantContext to request
    const tenantContext: TenantContext = {
      gymId: resolvedGymId || '',
      userId: user.sub,
      userEmail: user.email,
      userRole: user.role,
      isSuperAdmin,
    };

    request.tenantContext = tenantContext;
    return true;
  }
}
