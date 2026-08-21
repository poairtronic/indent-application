import { ConfigurationException } from '../exceptions/communication.exceptions';

export interface ISmtpConfig {
  service?: string;
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  from: string;
  fromName?: string;
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
    const service = process.env.SMTP_SERVICE || undefined;
    const host = process.env.SMTP_HOST || 'localhost';
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || '';
    const pass = process.env.SMTP_PASSWORD || '';
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'adminairtronic@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || process.env.EMAIL_FROM_NAME || 'MERC';
    const timeout = parseInt(process.env.SMTP_TIMEOUT || '5000', 10);
    const pool = process.env.SMTP_POOL === 'true';
    const maxConnections = parseInt(process.env.SMTP_MAX_CONNECTIONS || '5', 10);
    const maxMessages = parseInt(process.env.SMTP_MAX_MESSAGES || '100', 10);
    const rejectUnauthorized = process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false';

    // Basic Validation: host and port must be set if no service is provided.
    if (!service) {
      if (!host) {
        throw new ConfigurationException('SMTP_HOST', 'Host address is not defined.');
      }
      if (isNaN(port)) {
        throw new ConfigurationException('SMTP_PORT', 'Port number must be a valid integer.');
      }
    }

    return {
      service,
      host,
      port,
      user,
      pass,
      secure,
      from,
      fromName,
      timeout,
      pool,
      maxConnections,
      maxMessages,
      rejectUnauthorized,
    };
  }

  public static getAppMailConfig(): IAppMailConfig {
    const from = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'adminairtronic@gmail.com';
    return {
      appName: process.env.APP_NAME || 'MERC',
      appUrl: process.env.APP_URL || 'http://localhost:3000',
      replyTo:
        process.env.EMAIL_REPLY_TO ||
        process.env.MAIL_REPLY_TO ||
        from ||
        'adminairtronic@gmail.com',
      supportEmail:
        process.env.SUPPORT_EMAIL || process.env.MAIL_SUPPORT || 'adminairtronic@gmail.com',
    };
  }

  public static getFrontendUrl(): string {
    if (process.env.NODE_ENV === 'production') {
      if (!process.env.FRONTEND_URL) {
        throw new ConfigurationException('FRONTEND_URL', 'Frontend URL is required in production.');
      }
      return process.env.FRONTEND_URL;
    }
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }
}
