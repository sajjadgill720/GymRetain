import { Role } from './jwt-payload.interface';

export interface TenantContext {
  gymId: string;
  userId: string;
  userEmail: string;
  userRole: Role;
  isSuperAdmin: boolean;
}
