import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { SMTPException, ProviderUnavailableException } from '../exceptions/communication.exceptions';
import { google } from 'googleapis';
import * as nodemailer from 'nodemailer';
const MailComposer = require('nodemailer/lib/mail-composer');

@Injectable()
export class GmailApiProvider implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(GmailApiProvider.name);

  public async send(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return this.sendEmail(payload);
  }

  public async sendEmail(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    const config = CommunicationConfig.getGmailApiConfig();
    if (!config) {
      throw new ProviderUnavailableException(
        'GmailApiProvider',
        'Google OAuth2 credentials are not configured.',
      );
    }

    const appConfig = CommunicationConfig.getAppMailConfig();
    const fromName = process.env.SMTP_FROM_NAME || appConfig.appName || 'MERC APPLICATION';
    const fromEmail = config.user;
    const senderAddress = `${fromName} <${fromEmail}>`;

    const recipients = Array.isArray(payload.to) ? payload.to.join(', ') : payload.to;
    const replyTo = payload.replyTo || appConfig.replyTo || appConfig.supportEmail;

    const mailOptions: any = {
      from: senderAddress,
      to: recipients,
      subject: payload.subject,
      text: payload.body,
    };

    if (payload.html) {
      mailOptions.html = payload.html;
    }
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }
    if (payload.cc) {
      mailOptions.cc = Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc;
    }
    if (payload.bcc) {
      mailOptions.bcc = Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc;
    }
    if (payload.attachments && payload.attachments.length > 0) {
      mailOptions.attachments = payload.attachments.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.contentType,
      }));
    }

    try {
      this.logger.log(`Constructing MIME message for Gmail API delivery to: ${recipients}`);
      
      const mail = new MailComposer(mailOptions);
      const messageBuffer = await mail.compile().build();
      const encodedMessage = messageBuffer.toString('base64url');

      const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
      );
      
      oauth2Client.setCredentials({
        refresh_token: config.refreshToken,
      });

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      this.logger.log(`Dispatching email via Gmail API (HTTPS:443)`);
      
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
        },
      });

      this.logger.log(`Email dispatched via Gmail API successfully. Message ID: ${response.data.id}`);
      return {
        success: true,
        messageId: response.data.id || response.data.threadId || undefined,
      };
    } catch (error: any) {
      let failureReason = error?.message || String(error);
      const statusCode = error?.code || error?.response?.status;
      
      this.logger.error(`Gmail API delivery failed (Status: ${statusCode}): ${failureReason}`);
      
      if (error instanceof SMTPException) {
        throw error;
      }
      throw new SMTPException(new Error(`Gmail API error: ${failureReason}`));
    }
  }

  public async verify(): Promise<'ok' | 'degraded' | 'unavailable'> {
    const config = CommunicationConfig.getGmailApiConfig();
    if (!config) {
      return 'unavailable';
    }
    try {
      const oauth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
      );
      oauth2Client.setCredentials({ refresh_token: config.refreshToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      await gmail.users.getProfile({ userId: 'me' });
      return 'ok';
    } catch (e) {
      this.logger.warn(`Gmail API verification failed: ${(e as any)?.message || e}`);
      return 'degraded';
    }
  }
}
