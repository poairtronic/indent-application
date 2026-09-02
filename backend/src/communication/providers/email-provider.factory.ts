import { Injectable, Logger } from '@nestjs/common';
import { IEmailProvider, IEmailPayload } from '../interfaces/provider.interface';
import { CommunicationConfig } from '../config/communication.config';
import { GmailApiProvider } from './gmail-api.provider';

export type EmailProviderType = 'gmail-api';

@Injectable()
export class EmailProviderFactory implements IEmailProvider {
  public readonly channel = 'email';
  private readonly logger = new Logger(EmailProviderFactory.name);

  constructor(private readonly gmailApiProvider: GmailApiProvider) {}

  public getActiveProviderType(): EmailProviderType {
    return CommunicationConfig.getActiveProviderType();
  }

  public getActiveProvider(): IEmailProvider {
    return this.gmailApiProvider;
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
    this.logger.log(
      `Routing email dispatch through active provider: [${providerType.toUpperCase()}]`,
    );
    return activeProvider.sendEmail(payload);
  }

  public async verifyActiveProvider(): Promise<{
    provider: EmailProviderType;
    status: 'ok' | 'degraded' | 'unavailable';
  }> {
    const providerType = this.getActiveProviderType();
    const status = await this.gmailApiProvider.verify();

    return {
      provider: providerType,
      status,
    };
  }
}
