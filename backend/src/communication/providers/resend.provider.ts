import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { SMTPException, ProviderUnavailableException } from '../exceptions/communication.exceptions';

@Injectable()
export class ResendProvider implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(ResendProvider.name);

  public async send(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return this.sendEmail(payload);
  }

  public async sendEmail(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const apiKey = CommunicationConfig.getResendApiKey();
    if (!apiKey) {
      throw new ProviderUnavailableException(
        'ResendProvider',
        'RESEND_API_KEY environment variable is not configured.',
      );
    }

    const appConfig = CommunicationConfig.getAppMailConfig();
    const fromName = process.env.SMTP_FROM_NAME || appConfig.appName || 'MERC';
    const fromEmail =
      process.env.RESEND_FROM_EMAIL ||
      process.env.SMTP_FROM ||
      'onboarding@resend.dev';
    const senderAddress = `${fromName} <${fromEmail}>`;

    const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
    const replyTo = payload.replyTo || appConfig.replyTo || appConfig.supportEmail;

    const requestBody: any = {
      from: senderAddress,
      to: recipients,
      subject: payload.subject,
      text: payload.body,
    };

    if (payload.html) {
      requestBody.html = payload.html;
    }
    if (replyTo) {
      requestBody.reply_to = replyTo;
    }
    if (payload.cc) {
      requestBody.cc = Array.isArray(payload.cc) ? payload.cc : [payload.cc];
    }
    if (payload.bcc) {
      requestBody.bcc = Array.isArray(payload.bcc) ? payload.bcc : [payload.bcc];
    }
    if (payload.attachments && payload.attachments.length > 0) {
      requestBody.attachments = payload.attachments.map((att) => ({
        filename: att.filename,
        content: att.content ? Buffer.from(att.content).toString('base64') : undefined,
        path: att.path,
      }));
    }

    try {
      this.logger.log(`Dispatching email via Resend API (HTTPS:443) to: ${recipients.join(', ')}`);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData: any = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg =
          responseData?.message ||
          responseData?.error?.message ||
          `Resend HTTP ${response.status}: ${response.statusText}`;
        this.logger.error(`Resend API delivery failed: ${errorMsg}`);
        throw new SMTPException(new Error(`Resend API error: ${errorMsg}`));
      }

      this.logger.log(`Email dispatched via Resend successfully. Message ID: ${responseData?.id}`);
      return {
        success: true,
        messageId: responseData?.id,
      };
    } catch (error: any) {
      this.logger.error(`Resend API dispatch exception: ${error?.message || error}`);
      if (error instanceof SMTPException) {
        throw error;
      }
      throw new SMTPException(error);
    }
  }

  public async verify(): Promise<'ok' | 'degraded' | 'unavailable'> {
    const apiKey = CommunicationConfig.getResendApiKey();
    if (!apiKey) {
      return 'unavailable';
    }
    try {
      const response = await fetch('https://api.resend.com/api-keys', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
      return response.ok ? 'ok' : 'degraded';
    } catch (e) {
      this.logger.warn(`Resend API verification failed: ${(e as any)?.message || e}`);
      return 'degraded';
    }
  }
}
