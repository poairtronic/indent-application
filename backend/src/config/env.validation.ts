export function validateEnvironmentConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const required = isProd
    ? [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASSWORD',
        'SMTP_FROM',
        'FRONTEND_URL',
        'APP_URL',
      ]
    : [];

  const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');
  if (missing.length > 0) {
    const errorMsg = `[Configuration Error] Missing required production environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
