import { HttpException, HttpStatus } from '@nestjs/common';

export class CommunicationException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR) {
    super(
      {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
      },
      status,
    );
  }
}

export class TemplateNotFoundException extends CommunicationException {
  constructor(templateName: string) {
    super(`Template '${templateName}' not found in template library.`, HttpStatus.NOT_FOUND);
  }
}

export class ProviderUnavailableException extends CommunicationException {
  constructor(providerName: string, detail?: string) {
    super(
      `Communication provider '${providerName}' is currently unavailable. ${detail || ''}`,
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class InvalidRecipientException extends CommunicationException {
  constructor(recipient: string, reason?: string) {
    super(
      `Invalid recipient: '${recipient}'. Reason: ${reason || 'Invalid email format.'}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class ConfigurationException extends CommunicationException {
  constructor(key: string, detail?: string) {
    super(
      `Communication module configuration error for key '${key}': ${detail || 'Missing or invalid value.'}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class EmailRenderException extends CommunicationException {
  constructor(templateName: string, originalError: any) {
    super(
      `Failed to render email template '${templateName}': ${originalError?.message || originalError}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class SMTPException extends CommunicationException {
  constructor(originalError: any) {
    super(
      `SMTP transmission failed: ${originalError?.message || originalError}`,
      HttpStatus.BAD_GATEWAY,
    );
  }
}
