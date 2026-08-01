import { ConfigurationException } from '../exceptions/communication.exceptions';

export interface ISmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  from: string;
  timeout: number;
  pool: boolean;
  maxConnections: number;
  maxMessages: number;
  rejectUnauthorized: boolean;
}

export interface IAppMailConfig {
  appName: string;
  appUrl: string;
  replyTo?: string;
  supportEmail?: string;
}

export class CommunicationConfig {
  public static getSmtpConfig(): ISmtpConfig {
    const host = process.env.SMTP_HOST || 'localhost';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASSWORD || '';
    const secure = process.env.SMTP_SECURE === 'true';
    const from = process.env.SMTP_FROM || 'noreply@imcms.com';
    const timeout = parseInt(process.env.SMTP_TIMEOUT || '5000', 10);
    const pool = process.env.SMTP_POOL === 'true';
    const maxConnections = parseInt(process.env.SMTP_MAX_CONNECTIONS || '5', 10);
    const maxMessages = parseInt(process.env.SMTP_MAX_MESSAGES || '100', 10);
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

    // Basic Validation: host and port must be set.
    if (!host) {
      throw new ConfigurationException('SMTP_HOST', 'Host address is not defined.');
    }
    if (isNaN(port)) {
      throw new ConfigurationException('SMTP_PORT', 'Port number must be a valid integer.');
    }

    return {
      host,
      port,
      user,
      pass,
      secure,
      from,
      timeout,
      pool,
      maxConnections,
      maxMessages,
      rejectUnauthorized,
    };
  }

  public static getAppMailConfig(): IAppMailConfig {
    return {
      appName: process.env.APP_NAME || 'IMCMS ERP',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      replyTo: process.env.MAIL_REPLY_TO || process.env.SMTP_FROM,
      supportEmail: process.env.MAIL_SUPPORT || 'support@imcms.com',
    };
  }
}
