export type Role = 'SUPER_ADMIN' | 'GYM_OWNER' | 'GYM_STAFF';

export interface JwtPayload {
  sub: string;         // staff user ID
  gymId: string | null;// gym ID (null only for super_admin)
  email: string;
  role: Role;
  name: string;
  iat?: number;
  exp?: number;
}
