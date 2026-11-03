import {
  CanActivate,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * Validates header 'x-internal-secret' against environment variable MERC_INTERNAL_SECRET.
 * Implements M2M bridge authentication for internal cross-service calls without requiring user JWT.
 */
@Injectable()
export class InternalSecretGuard implements CanActivate {
  private readonly logger = new Logger(InternalSecretGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const configuredSecret = process.env.MERC_INTERNAL_SECRET;

    if (!configuredSecret || configuredSecret.trim() === '') {
      this.logger.error(
        'MERC_INTERNAL_SECRET is not configured or is empty in environment variables.',
      );
      throw new InternalServerErrorException('Internal server authentication configuration error.');
    }

    const request = context.switchToHttp().getRequest();
    const rawHeader = request.headers['x-internal-secret'];
    const providedSecret = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;

    if (!providedSecret || typeof providedSecret !== 'string' || providedSecret.trim() === '') {
      throw new UnauthorizedException('Missing or invalid x-internal-secret header.');
    }

    const expectedBuffer = Buffer.from(configuredSecret);
    const providedBuffer = Buffer.from(providedSecret);

    if (
      expectedBuffer.length !== providedBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
    ) {
      throw new UnauthorizedException('Invalid internal secret.');
    }

    return true;
  }
}
