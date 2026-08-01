import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NodemailerProvider } from './providers/nodemailer.provider';
import { TemplateEngine } from './templates/template.engine';
import { RecipientResolver, IResolverQuery } from './resolver/recipient.resolver';
import { IEmailPayload, IEmailAttachment } from './interfaces/provider.interface';
import { SMTPException } from './exceptions/communication.exceptions';

export interface ISendEmailOptions {
  to: string | string[] | IResolverQuery;
  subject: string;
  templateName: string;
  templateContext?: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: IEmailAttachment[];
  replyTo?: string;
}

@Injectable()
export class CommunicationService {
  private readonly logger = new Logger(CommunicationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailProvider: NodemailerProvider,
    private readonly templateEngine: TemplateEngine,
    private readonly recipientResolver: RecipientResolver,
  ) {}

  /**
   * Main entrypoint to dispatch emails using layout templates and dynamically resolved recipients.
   * Resolves target addresses, compiles Handlebars content, triggers delivery, and stores EmailLogs.
   */
  public async sendEmail(
    options: ISendEmailOptions,
  ): Promise<{ success: boolean; messageId?: string }> {
    this.logger.log(`Received sendEmail request for template: ${options.templateName}`);

    // 1. Resolve recipients
    let recipients: string[] = [];
    if (typeof options.to === 'string') {
      recipients = [options.to];
    } else if (Array.isArray(options.to)) {
      recipients = options.to;
    } else {
      // It's a query block, resolve dynamically
      recipients = await this.recipientResolver.resolve(options.to);
    }

    if (recipients.length === 0) {
      this.logger.warn('Recipient list is empty. Aborting email dispatch.');
      return { success: false };
    }

    // 2. Render layout-body template
    const renderedBodyHtml = this.templateEngine.render(
      options.templateName,
      options.templateContext,
    );

    // 3. Setup core payload
    const payload: IEmailPayload = {
      to: recipients,
      subject: options.subject,
      body: `This is a formatted HTML email from IMCMS ERP portal. Please enable HTML viewing.`,
      html: renderedBodyHtml,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      attachments: options.attachments,
    };

    // 4. Send via provider & Log transaction in Database
    try {
      const result = await this.emailProvider.sendEmail(payload);

      // Save log records for each recipient
      await this.saveEmailLogs(recipients, options, renderedBodyHtml, 'SENT');

      return {
        success: true,
        messageId: result.messageId,
      };
    } catch (error) {
      this.logger.error(
        `Failed to complete SMTP email dispatch: ${error?.message || error}`,
        error?.stack,
      );
      await this.saveEmailLogs(
        recipients,
        options,
        renderedBodyHtml,
        'FAILED',
        error?.message || String(error),
      );
      throw new SMTPException(error);
    }
  }

  /**
   * Persists details of dispatched communication into database logs.
   */
  private async saveEmailLogs(
    recipients: string[],
    options: ISendEmailOptions,
    body: string,
    status: 'SENT' | 'FAILED',
    errorMessage?: string,
  ): Promise<void> {
    try {
      const logPromises = recipients.map(async (recipient) => {
        // Try to match recipient string to user ID to establish DB relations
        const matchedUser = await this.prisma.user.findFirst({
          where: { email: { equals: recipient.trim(), mode: 'insensitive' }, isDeleted: false },
          select: { id: true },
        });

        return this.prisma.emailLog.create({
          data: {
            to: recipient,
            userId: matchedUser?.id || null,
            subject: options.subject,
            body: body,
            status: status,
            errorMessage: errorMessage || null,
            cc: options.cc
              ? Array.isArray(options.cc)
                ? options.cc.join(', ')
                : options.cc
              : null,
            bcc: options.bcc
              ? Array.isArray(options.bcc)
                ? options.bcc.join(', ')
                : options.bcc
              : null,
          },
        });
      });

      await Promise.all(logPromises);
    } catch (dbError) {
      this.logger.error(
        'Failed to write email transaction logs to Database',
        dbError?.stack || dbError,
      );
    }
  }
}
