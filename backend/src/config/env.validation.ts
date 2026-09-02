export function validateEnvironmentConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const missing: string[] = [];

  const requiredVars = isProd
    ? [
        'DATABASE_URL',
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'GOOGLE_REFRESH_TOKEN',
        'GOOGLE_GMAIL_USER',
        'FRONTEND_URL',
        'APP_URL',
      ]
    : [];

  requiredVars.forEach((key) => {
    if (!process.env[key] || process.env[key]?.trim() === '') {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    const errorMsg = `[Configuration Error] Missing required production environment variables: ${missing.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
}
