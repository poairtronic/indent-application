import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { NodemailerProvider } from './nodemailer.provider';
import { ResendProvider } from './resend.provider';
import { BrevoProvider } from './brevo.provider';
import { SendGridProvider } from './sendgrid.provider';

export type EmailProviderType = 'resend' | 'brevo' | 'sendgrid' | 'smtp';

@Injectable()
export class EmailProviderFactory implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(
    private readonly nodemailerProvider: NodemailerProvider,
    private readonly resendProvider: ResendProvider,
    private readonly brevoProvider: BrevoProvider,
    private readonly sendGridProvider: SendGridProvider,
  ) {}

  public getActiveProviderType(): EmailProviderType {
    return CommunicationConfig.getActiveProviderType();
  }

  public getActiveProvider(): IEmailProvider {
    const type = this.getActiveProviderType();
    switch (type) {
      case 'resend':
        return this.resendProvider;
      case 'brevo':
        return this.brevoProvider;
      case 'sendgrid':
        return this.sendGridProvider;
      case 'smtp':
      default:
        return this.nodemailerProvider;
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
    const activeProvider = this.getActiveProvider();
    const providerType = this.getActiveProviderType();
    this.logger.log(`Routing email dispatch through active provider: [${providerType.toUpperCase()}]`);
    return activeProvider.sendEmail(payload);
  }

  public async verifyActiveProvider(): Promise<{
    provider: EmailProviderType;
    status: 'ok' | 'degraded' | 'unavailable';
  }> {
    const providerType = this.getActiveProviderType();
    let status: 'ok' | 'degraded' | 'unavailable' = 'unavailable';

    switch (providerType) {
      case 'resend':
        status = await this.resendProvider.verify();
        break;
      case 'brevo':
        status = await this.brevoProvider.verify();
        break;
      case 'sendgrid':
        status = await this.sendGridProvider.verify();
        break;
      case 'smtp':
      default:
        status = await this.nodemailerProvider.verifySmtp();
        break;
    }

    return {
      provider: providerType,
      status,
    };
  }
}
