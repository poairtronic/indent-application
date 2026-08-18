import { validateEnvironmentConfig } from '../env.validation';

describe('Environment Validation (Phase B8)', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should pass successfully with valid production configuration', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'supersecretpass';
    process.env.SMTP_FROM = 'no-reply@example.com';
    process.env.FRONTEND_URL = 'https://example-frontend.com';
    process.env.APP_URL = 'https://example-api.com';

    expect(() => validateEnvironmentConfig()).not.toThrow();
  });

  it('should fail startup with configuration error if SMTP_PASSWORD is missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = ''; // Missing
    process.env.SMTP_FROM = 'no-reply@example.com';
    process.env.FRONTEND_URL = 'https://example-frontend.com';
    process.env.APP_URL = 'https://example-api.com';

    expect(() => validateEnvironmentConfig()).toThrow(/SMTP_PASSWORD/);
  });

  it('should fail startup with configuration error if FRONTEND_URL is missing in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'user@example.com';
    process.env.SMTP_PASSWORD = 'supersecretpass';
    process.env.SMTP_FROM = 'no-reply@example.com';
    process.env.FRONTEND_URL = ''; // Missing
    process.env.APP_URL = 'https://example-api.com';

    expect(() => validateEnvironmentConfig()).toThrow(/FRONTEND_URL/);
  });

  it('should allow missing production variables in development', () => {
    process.env.NODE_ENV = 'development';
    process.env.SMTP_HOST = '';
    process.env.FRONTEND_URL = '';

    expect(() => validateEnvironmentConfig()).not.toThrow();
  });
});
