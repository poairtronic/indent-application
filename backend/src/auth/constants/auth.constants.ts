export const jwtConstants = {
  secret: process.env.JWT_SECRET ?? 'super_secret_access_token_key_123456',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'super_secret_refresh_token_key_7891011',
  accessTokenExpiresIn: '15m' as const,
  refreshTokenExpiresIn: '7d' as const,
};
