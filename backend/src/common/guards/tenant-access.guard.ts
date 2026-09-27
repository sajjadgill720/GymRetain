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

    let resolvedGymId: string;

    if (isSuperAdmin) {
      // Super admin can specify target tenant via header or route parameter
      const headerGymId = request.headers['x-gym-id'] as string;
      const paramGymId = request.params?.gymId as string;
      resolvedGymId = headerGymId || paramGymId || user.gymId || '';
    } else {
      // Gym staff or gym owner MUST have a gymId bound to their verified DB identity
      if (!user.gymId) {
        throw new ForbiddenException('Tenant access denied: user is not assigned to a gym');
      }

      // Check for any client-side tenant injection attempts in headers, query, or body
      const headerGymId = request.headers['x-gym-id'] as string;
      const queryGymId = request.query?.gymId as string;
      const bodyGymId = request.body?.gymId as string;
      const paramGymId = request.params?.gymId as string;

      if (
        (headerGymId && headerGymId !== user.gymId) ||
        (queryGymId && queryGymId !== user.gymId) ||
        (bodyGymId && bodyGymId !== user.gymId) ||
        (paramGymId && paramGymId !== user.gymId)
      ) {
        throw new ForbiddenException(
          'Tenant isolation violation: client-controlled gym_id does not match session',
        );
      }

      // Ensure client-provided body or query can never overwrite the server session gymId
      if (request.body && typeof request.body === 'object') {
        delete request.body.gymId;
        delete request.body.gym_id;
      }

      resolvedGymId = user.gymId;
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
