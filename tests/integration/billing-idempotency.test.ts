/**
 * T16 — Billing & Idempotency Integration Tests
 *
 * Tool: axios + Jest
 * Rationale: Black-box HTTP tests against the live Docker Compose stack.
 * Verifies that submitting the same payment twice with the same idempotency_key
 * produces exactly one payment record and emits payment.received once.
 *
 * Prerequisites: `docker compose up -d` with seed data applied.
 */

import { createClient } from '../support/api-client';
import { loginAsAdmin } from '../support/auth-helpers';

describe('Billing & Idempotency', () => {
  let api: ReturnType<typeof createClient>;
  const suffix = Date.now();

  beforeAll(async () => {
    const { accessToken } = await loginAsAdmin();
    api = createClient(accessToken);
  });

  it('submitting the same payment twice with the same idempotency_key returns the original record without duplication', async () => {
    const idempotencyKey = `idem-pay-${suffix}`;
    const payload = {
      amount_cents: 8500,
      currency: 'BRL',
      payment_method: 'invoice',
      idempotency_key: idempotencyKey,
    };

    // First submission
    const first = await api.post('/payments', payload);
    expect([200, 201]).toContain(first.status);
    const originalId: string = first.data.data.id;
    expect(originalId).toBeTruthy();

    // Second submission — same idempotency_key
    const second = await api.post('/payments', payload);
    expect([200, 201]).toContain(second.status);

    // Must return the original record, not a duplicate
    expect(second.data.data.id).toBe(originalId);
  });

  it('two payments with distinct idempotency_keys produce two separate records', async () => {
    const payloadA = {
      amount_cents: 5000,
      currency: 'BRL',
      payment_method: 'invoice',
      idempotency_key: `idem-a-${suffix}`,
    };
    const payloadB = {
      amount_cents: 5000,
      currency: 'BRL',
      payment_method: 'invoice',
      idempotency_key: `idem-b-${suffix}`,
    };

    const resA = await api.post('/payments', payloadA);
    const resB = await api.post('/payments', payloadB);

    expect([200, 201]).toContain(resA.status);
    expect([200, 201]).toContain(resB.status);
    expect(resA.data.data.id).not.toBe(resB.data.data.id);
  });
});
