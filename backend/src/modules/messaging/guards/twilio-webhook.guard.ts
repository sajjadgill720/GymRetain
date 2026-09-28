import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
  Inject,
} from '@nestjs/common';
import { MessagingProvider } from '../interfaces/messaging-provider.interface';

@Injectable()
export class TwilioWebhookGuard implements CanActivate {
  private readonly logger = new Logger(TwilioWebhookGuard.name);

  constructor(
    @Inject('MessagingProvider')
    private readonly provider: MessagingProvider,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Allow interactive front-desk simulator requests without Twilio signature
    if (request.url?.includes('whatsapp/simulate')) {
      return true;
    }

    const headers = request.headers || {};
    const body = request.body || {};
    const fullUrl = `${request.protocol}://${request.get('host')}${request.originalUrl}`;

    const isValid = this.provider.verifyWebhookSignature(headers, body, fullUrl);

    if (!isValid) {
      this.logger.warn(
        `Rejected unauthenticated WhatsApp webhook call: missing or invalid signature from IP ${request.ip}`,
      );
      throw new UnauthorizedException('Invalid or missing WhatsApp webhook signature');
    }

    return true;
  }
}
