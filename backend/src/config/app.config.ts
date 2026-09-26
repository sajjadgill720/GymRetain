export interface AppConfig {
  port: number;
  environment: string;
  apiPrefix: string;
  qrTokenSecret: string;
}

export const appConfig = (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT || '4000', 10),
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    qrTokenSecret: process.env.QR_TOKEN_SECRET || 'gymretain-qr-signing-secret',
  },
});
