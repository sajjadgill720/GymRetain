export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export const jwtConfig = (): { jwt: JwtConfig } => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'gymretain-super-secure-jwt-secret-min-32-chars-long',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
});
