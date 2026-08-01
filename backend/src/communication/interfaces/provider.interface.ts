/**
 * Phase 16A - Provider Interface Abstraction
 * Abstraction layer to support multiple communication channels (Email, SMS, WhatsApp, Slack, Teams)
 */

export interface ICommunicationPayload {
  to: string | string[];
  subject?: string;
  body: string;
  meta?: Record<string, any>;
}

export interface ICommunicationProvider {
  channel: 'email' | 'sms' | 'whatsapp' | 'slack' | 'teams' | 'webhook';
  send(
    payload: ICommunicationPayload,
  ): Promise<{ success: boolean; messageId?: string; error?: any }>;
}
export interface IEmailAttachment {
  filename: string;
  content?: any;
  path?: string;
  contentType?: string;
}

export interface IEmailPayload extends ICommunicationPayload {
  to: string | string[];
  subject: string;
  body: string; // Plain text or HTML rendered body
  html?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: IEmailAttachment[];
}

export interface IEmailProvider extends ICommunicationProvider {
  channel: 'email';
  sendEmail(payload: IEmailPayload): Promise<{ success: boolean; messageId?: string; error?: any }>;
}
