import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import {
  SMTPException,
  ProviderUnavailableException,
} from '../exceptions/communication.exceptions';

@Injectable()
export class NodemailerProvider implements IEmailProvider {
  public readonly channel = 'email';
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(NodemailerProvider.name);

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    try {
      const config = CommunicationConfig.getSmtpConfig();
      this.logger.log(
        `Initializing Nodemailer transporter pointing to ${config.host}:${config.port}`,
      );

      // Basic credentials structure configuration setup
      const smtpOptions: any = {
        host: config.host,
        port: config.port,
        secure: config.secure,
        pool: config.pool,
        connectionTimeout: config.timeout,
        greetingTimeout: config.timeout,
        socketTimeout: config.timeout,
        tls: {
          rejectUnauthorized: config.rejectUnauthorized,
        },
      };

      if (config.user || config.pass) {
        smtpOptions.auth = {
          user: config.user,
          pass: config.pass,
        };
      }

      if (config.pool) {
        smtpOptions.maxConnections = config.maxConnections;
        smtpOptions.maxMessages = config.maxMessages;
      }

      this.transporter = nodemailer.createTransport(smtpOptions);
    } catch (error) {
      this.logger.error('Failed to initialize SMTP transporter', error?.stack || error);
      this.transporter = null;
    }
  }

  public async send(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    return this.sendEmail(payload);
  }

  public async sendEmail(
    payload: IEmailPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }> {
    if (!this.transporter) {
      // Re-try setup if initialized with invalid state
      this.initializeTransporter();
      if (!this.transporter) {
        throw new ProviderUnavailableException(
          'Nodemailer SMTP Transporter',
          'Transporter not initialized.',
        );
      }
    }

    const config = CommunicationConfig.getSmtpConfig();
    const appConfig = CommunicationConfig.getAppMailConfig();

    const mailOptions: nodemailer.SendMailOptions = {
      from: payload.meta?.from || config.from,
      to: payload.to,
      subject: payload.subject,
      text: payload.body,
      html: payload.html || undefined,
      replyTo: payload.replyTo || appConfig.replyTo,
      cc: payload.cc || undefined,
      bcc: payload.bcc || undefined,
      attachments: payload.attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
        path: att.path,
        contentType: att.contentType,
      })),
    };

    try {
      this.logger.log(
        `Dispatching email to recipient: ${Array.isArray(payload.to) ? payload.to.join(', ') : payload.to}`,
      );
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email dispatched successfully. Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`SMTP delivery failed: ${error?.message || error}`, error?.stack);
      throw new SMTPException(error);
    }
  }
}
