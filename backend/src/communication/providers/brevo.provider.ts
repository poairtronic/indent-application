import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { SMTPException, ProviderUnavailableException } from '../exceptions/communication.exceptions';

@Injectable()
export class BrevoProvider implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(BrevoProvider.name);

  public async send(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return this.sendEmail(payload);
  }

  public async sendEmail(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const apiKey = CommunicationConfig.getBrevoApiKey();
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'BrevoProvider',
        'BREVO_API_KEY environment variable is not configured.',
      );
    }

    const appConfig = CommunicationConfig.getAppMailConfig();
    const fromName = process.env.SMTP_FROM_NAME || appConfig.appName || 'MERC';
    const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'posuppportairtronic@gmail.com';

    const rawRecipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const to = rawRecipients.map((email) => ({ email: email.trim() }));
    const replyToEmail = payload.replyTo || appConfig.replyTo || fromEmail;

    const requestBody: any = {
      sender: { name: fromName, email: fromEmail },
      to,
      subject: payload.subject,
      textContent: payload.body,
      htmlContent: payload.html || undefined,
    };

    if (replyToEmail) {
      requestBody.replyTo = { email: replyToEmail };
    }
    if (payload.cc) {
      const ccList = Array.isArray(payload.cc) ? payload.cc : [payload.cc];
      requestBody.cc = ccList.map((email) => ({ email: email.trim() }));
    }
    if (payload.bcc) {
      const bccList = Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc];
      requestBody.bcc = bccList.map((email) => ({ email: email.trim() }));
    }
    if (payload.attachments && payload.attachments.length > 0) {
      requestBody.attachment = payload.attachments.map((att) => ({
        name: att.filename,
        content: att.content ? Buffer.from(att.content).toString('base64') : undefined,
        url: att.path,
      }));
    }

    try {
      this.logger.log(`Dispatching email via Brevo API (HTTPS:443) to: ${rawRecipients.join(', ')}`);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          `Brevo HTTP ${response.status}: ${response.statusText}`;
        this.logger.error(`Brevo API delivery failed: ${errorMsg}`);
        throw new SMTPException(new Error(`Brevo API error: ${errorMsg}`));
      }

      this.logger.log(`Email dispatched via Brevo successfully. Message ID: ${responseData?.messageId}`);
      return {
        success: true,
        messageId: responseData?.messageId,
      };
    } catch (error: any) {
      this.logger.error(`Brevo API dispatch exception: ${error?.message || error}`);
      if (error instanceof SMTPException) {
        throw error;
      }
      throw new SMTPException(error);
    }
  }

  public async verify(): Promise<'ok' | 'degraded' | 'unavailable'> {
    const apiKey = CommunicationConfig.getBrevoApiKey();
    if (!apiKey) {
      return 'unavailable';
    }
    try {
      const response = await fetch('https://api.brevo.com/v3/account', {
        method: 'GET',
        headers: {
          'api-key': apiKey,
        },
      });
      return response.ok ? 'ok' : 'degraded';
    } catch (e) {
      this.logger.warn(`Brevo API verification failed: ${(e as any)?.message || e}`);
      return 'degraded';
    }
  }
}
