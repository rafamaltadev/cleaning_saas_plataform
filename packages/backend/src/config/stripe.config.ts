import { Logger } from '@nestjs/common';

const logger = new Logger('StripeConfig');

let stripeInstance: any = null;

export function getStripeClient(): any {
  if (stripeInstance) return stripeInstance;

  const secretKey = process.env.STRIPE_PLATFORM_SECRET_KEY;
  if (!secretKey) {
    logger.warn('STRIPE_PLATFORM_SECRET_KEY is not set — Stripe features will be unavailable');
    return null;
  }

  const StripeLib = require('stripe');
  stripeInstance = new StripeLib(secretKey, { apiVersion: '2026-04-22.dahlia' });
  return stripeInstance;
}

export function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_PLATFORM_WEBHOOK_SECRET ?? '';
  if (!secret) {
    logger.warn('STRIPE_PLATFORM_WEBHOOK_SECRET is not set — webhook validation will fail');
  }
  return secret;
}

export function getStripePublishableKey(): string {
  return process.env.STRIPE_PLATFORM_PUBLISHABLE_KEY ?? '';
}
