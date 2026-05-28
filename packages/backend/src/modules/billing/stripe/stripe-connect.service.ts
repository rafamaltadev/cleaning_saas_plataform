import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import type { Stripe } from 'stripe/cjs/stripe.core';

@Injectable()
export class StripeConnectService {
  private readonly logger = new Logger(StripeConnectService.name);

  private getStripe(): Stripe {
    const secretKey = process.env.STRIPE_PLATFORM_SECRET_KEY;
    if (!secretKey) throw new InternalServerErrorException('STRIPE_PLATFORM_SECRET_KEY not set');
    const StripeLib = require('stripe');
    return new StripeLib(secretKey, { apiVersion: '2026-04-22.dahlia' });
  }

  async createConnectAccount(params: {
    tenantId: string;
    country: string;
    email: string;
  }): Promise<Stripe.Account> {
    const stripe = this.getStripe();
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: params.country,
        email: params.email,
        metadata: { tenant_id: params.tenantId },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      this.logger.log(`Created Connect account for tenant ${params.tenantId}`);
      return account;
    } catch (err) {
      this.logger.error(`Failed to create Connect account for tenant ${params.tenantId}`, err);
      throw err;
    }
  }

  async createAccountLink(params: {
    accountId: string;
    returnUrl: string;
    refreshUrl: string;
    type: string;
  }): Promise<Stripe.AccountLink> {
    const stripe = this.getStripe();
    try {
      const link = await stripe.accountLinks.create({
        account: params.accountId,
        return_url: params.returnUrl,
        refresh_url: params.refreshUrl,
        type: params.type as Stripe.AccountLinkCreateParams.Type,
      });
      return link;
    } catch (err) {
      this.logger.error(`Failed to create account link for account ${params.accountId}`, err);
      throw err;
    }
  }

  async retrieveAccount(accountId: string): Promise<Stripe.Account> {
    const stripe = this.getStripe();
    try {
      return await stripe.accounts.retrieve(accountId);
    } catch (err) {
      this.logger.error(`Failed to retrieve account ${accountId}`, err);
      throw err;
    }
  }

  async createLoginLink(accountId: string): Promise<Stripe.LoginLink> {
    const stripe = this.getStripe();
    try {
      return await stripe.accounts.createLoginLink(accountId);
    } catch (err) {
      this.logger.error(`Failed to create login link for account ${accountId}`, err);
      throw err;
    }
  }

  async disconnectAccount(accountId: string): Promise<void> {
    const stripe = this.getStripe();
    try {
      await stripe.accounts.del(accountId);
      this.logger.log(`Disconnected account ${accountId}`);
    } catch (err) {
      this.logger.error(`Failed to disconnect account ${accountId}`, err);
      throw err;
    }
  }
}
