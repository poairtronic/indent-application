export function validateEnvironmentConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const required = isProd
    ? [
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_FROM',
        'FRONTEND_URL',
        'APP_URL',
      ]
    : [];

  const missing = required.filter((key) => !process.env[key] || process.env[key].trim() === '');
  // Render historically used SMTP_PASS while the application documentation
  // uses SMTP_PASSWORD. Accept both names, but require one in production.
  if (isProd && !process.env.SMTP_PASSWORD?.trim() && !process.env.SMTP_PASS?.trim()) {
    missing.push('SMTP_PASSWORD (or SMTP_PASS)');
  }
  if (missing.length > 0) {
    const errorMsg = `[Configuration Error] Missing required production environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
