export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
    name: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION ?? '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION ?? '30d',
    publicClientAccessExpiration: process.env.PUBLIC_CLIENT_TOKEN_EXPIRATION ?? '60m',
  },
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60000', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '100', 10),
    authTtl: parseInt(process.env.THROTTLE_AUTH_TTL ?? '60000', 10),
    authLimit: parseInt(process.env.THROTTLE_AUTH_LIMIT ?? '5', 10),
  },
  google: {
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_OAUTH_CALLBACK_URL ?? 'http://localhost:3000/api/v1/public',
  },
  facebook: {
    appId: process.env.FACEBOOK_OAUTH_APP_ID,
    appSecret: process.env.FACEBOOK_OAUTH_APP_SECRET,
    callbackUrl: process.env.FACEBOOK_OAUTH_CALLBACK_URL ?? 'http://localhost:3000/api/v1/public',
  },
});
