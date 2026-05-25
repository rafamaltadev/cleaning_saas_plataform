import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().default(5432),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USER: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  JWT_SECRET: Joi.string().required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRATION: Joi.string().default('30d'),
  PUBLIC_CLIENT_TOKEN_EXPIRATION: Joi.string().default('60m'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(100),
  THROTTLE_AUTH_TTL: Joi.number().default(60000),
  THROTTLE_AUTH_LIMIT: Joi.number().default(5),
  // OAuth — optional, graceful fallback when missing
  GOOGLE_OAUTH_CLIENT_ID: Joi.string().optional().allow(''),
  GOOGLE_OAUTH_CLIENT_SECRET: Joi.string().optional().allow(''),
  GOOGLE_OAUTH_CALLBACK_URL: Joi.string().optional().allow(''),
  FACEBOOK_OAUTH_APP_ID: Joi.string().optional().allow(''),
  FACEBOOK_OAUTH_APP_SECRET: Joi.string().optional().allow(''),
  FACEBOOK_OAUTH_CALLBACK_URL: Joi.string().optional().allow(''),
  // Stripe — optional, graceful degradation when missing
  STRIPE_PLATFORM_SECRET_KEY: Joi.string().optional().allow(''),
  STRIPE_PLATFORM_PUBLISHABLE_KEY: Joi.string().optional().allow(''),
  STRIPE_PLATFORM_WEBHOOK_SECRET: Joi.string().optional().allow(''),
  PLATFORM_FEE_PERCENT: Joi.number().default(1),
  STRIPE_FEE_BR_CARD_PERCENT: Joi.number().default(3.99),
  STRIPE_FEE_BR_PIX_PERCENT: Joi.number().default(0.99),
  STRIPE_FEE_US_CARD_PERCENT: Joi.number().default(2.9),
});
