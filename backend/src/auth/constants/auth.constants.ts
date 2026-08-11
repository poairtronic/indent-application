const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || jwtSecret.trim() === '') {
  throw new Error(
    'CRITICAL: JWT_SECRET environment variable is missing or empty. Application cannot start securely.',
  );
}

if (!jwtRefreshSecret || jwtRefreshSecret.trim() === '') {
  throw new Error(
    'CRITICAL: JWT_REFRESH_SECRET environment variable is missing or empty. Application cannot start securely.',
  );
}

if (jwtSecret === jwtRefreshSecret) {
  throw new Error(
    'CRITICAL: JWT_SECRET and JWT_REFRESH_SECRET must not be identical. Application cannot start securely.',
  );
}

export const jwtConstants = {
  secret: jwtSecret,
  refreshSecret: jwtRefreshSecret,
  accessTokenExpiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any,
  refreshTokenExpiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any,
};
