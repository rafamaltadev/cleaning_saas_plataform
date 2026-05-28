import { DataSource } from 'typeorm';
import { StripeTermsVersion } from '../../modules/billing/connect/stripe-terms-version.entity';

const TERMS_CONTENT_BR = `Termos de Serviço de Pagamentos — v1.0

Ao aceitar estes termos, você concorda em utilizar os serviços de pagamento fornecidos por esta plataforma em parceria com a Stripe.

Taxas da Plataforma:
- Taxa de plataforma: 1% por transação
- Taxa Stripe (cartão): 3,99% por transação
- Taxa Stripe (PIX): 0,99% por transação

Pagamentos são processados via Stripe Connect Express. Fundos são transferidos para sua conta bancária conforme o calendário de repasse estabelecido.

Você é responsável por manter sua conta Stripe Connect ativa e em conformidade com os Termos de Serviço da Stripe.`;

const TERMS_CONTENT_US = `Payment Services Terms of Service — v1.0

By accepting these terms, you agree to use the payment services provided by this platform in partnership with Stripe.

Platform Fees:
- Platform fee: 1% per transaction
- Stripe fee (card): 2.9% per transaction
- Stripe fee (ACH): 0.8% per transaction

Payments are processed via Stripe Connect Express. Funds are transferred to your bank account per the established payout schedule.

You are responsible for maintaining your Stripe Connect account in good standing and compliant with Stripe's Terms of Service.`;

export async function seedStripeTerms(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(StripeTermsVersion);

  const existing = await repo.count();
  if (existing > 0) {
    console.log('Stripe terms already seeded, skipping.');
    return;
  }

  const effectiveFrom = new Date('2024-01-01T00:00:00Z');

  await repo.save([
    {
      version: 'v1.0-BR-pt-BR',
      country: 'BR',
      language: 'pt-BR',
      content: TERMS_CONTENT_BR,
      platform_fee_percent: 1,
      stripe_fee_card_percent: 3.99,
      stripe_fee_pix_percent: 0.99,
      stripe_fee_ach_percent: null,
      effective_from: effectiveFrom,
      effective_until: null,
    },
    {
      version: 'v1.0-US-en',
      country: 'US',
      language: 'en',
      content: TERMS_CONTENT_US,
      platform_fee_percent: 1,
      stripe_fee_card_percent: 2.9,
      stripe_fee_pix_percent: null,
      stripe_fee_ach_percent: 0.8,
      effective_from: effectiveFrom,
      effective_until: null,
    },
    {
      version: 'v1.0-US-es',
      country: 'US',
      language: 'es',
      content: TERMS_CONTENT_US,
      platform_fee_percent: 1,
      stripe_fee_card_percent: 2.9,
      stripe_fee_pix_percent: null,
      stripe_fee_ach_percent: 0.8,
      effective_from: effectiveFrom,
      effective_until: null,
    },
  ]);

  console.log('Stripe terms seeded successfully.');
}
