import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { SMTPException, ProviderUnavailableException } from '../exceptions/communication.exceptions';

@Injectable()
export class SendGridProvider implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(SendGridProvider.name);

  public async send(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return this.sendEmail(payload);
  }

  public async sendEmail(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const apiKey = CommunicationConfig.getSendGridApiKey();
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'SendGridProvider',
        'SENDGRID_API_KEY environment variable is not configured.',
      );
    }

    const appConfig = CommunicationConfig.getAppMailConfig();
    const fromName = process.env.SMTP_FROM_NAME || appConfig.appName || 'MERC';
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'posuppportairtronic@gmail.com';

    const rawRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const to = rawRecipients.map((email) => ({ email: email.trim() }));
    const replyToEmail = payload.replyTo || appConfig.replyTo || fromEmail;

    const personalization: any = { to };
    if (payload.cc) {
      const ccList = Array.isArray(payload.cc) ? payload.cc : [payload.cc];
      personalization.cc = ccList.map((email) => ({ email: email.trim() }));
    }
    if (payload.bcc) {
      const bccList = Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc];
      personalization.bcc = bccList.map((email) => ({ email: email.trim() }));
    }

    const content: Array<{ type: string; value: string }> = [];
    if (payload.body) {
      content.push({ type: 'text/plain', value: payload.body });
    }
    if (payload.html) {
      content.push({ type: 'text/html', value: payload.html });
    }

    const requestBody: any = {
      personalizations: [personalization],
      from: { email: fromEmail, name: fromName },
      subject: payload.subject,
      content: content.length > 0 ? content : [{ type: 'text/plain', value: payload.subject }],
    };

    if (replyToEmail) {
      requestBody.reply_to = { email: replyToEmail, name: fromName };
    }

    if (payload.attachments && payload.attachments.length > 0) {
      requestBody.attachments = payload.attachments.map((att) => ({
        content: att.content ? Buffer.from(att.content).toString('base64') : '',
        filename: att.filename,
        type: att.contentType || 'application/octet-stream',
        disposition: 'attachment',
      }));
    }

    try {
      this.logger.log(`Dispatching email via SendGrid API (HTTPS:443) to: ${rawRecipients.join(', ')}`);
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseData: any = await response.json().catch(() => ({}));
        const errorMsg =
          responseData?.errors?.[0]?.message ||
          `SendGrid HTTP ${response.status}: ${response.statusText}`;
        this.logger.error(`SendGrid API delivery failed: ${errorMsg}`);
        throw new SMTPException(new Error(`SendGrid API error: ${errorMsg}`));
      }

      const messageId = response.headers.get('x-message-id') || undefined;
      this.logger.log(`Email dispatched via SendGrid successfully. Message ID: ${messageId}`);
      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      this.logger.error(`SendGrid API dispatch exception: ${error?.message || error}`);
      if (error instanceof SMTPException) {
        throw error;
      }
      throw new SMTPException(error);
    }
  }

  public async verify(): Promise<'ok' | 'degraded' | 'unavailable'> {
    const apiKey = CommunicationConfig.getSendGridApiKey();
    if (!apiKey) {
      return 'unavailable';
    }
    try {
      const response = await fetch('https://api.sendgrid.com/v3/scopes', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok ? 'ok' : 'degraded';
    } catch (e) {
      this.logger.warn(`SendGrid API verification failed: ${(e as any)?.message || e}`);
      return 'degraded';
    }
  }
}
