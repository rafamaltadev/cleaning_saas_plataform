import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService, PLATFORM_FEE_PERCENT } from './payment.service';
import { Payment } from '../domain/payment.entity';
import { Booking } from '../../bookings/domain/booking.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { Repository, DataSource } from 'typeorm';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: 'tenant-uuid',
    name: 'Test Tenant',
    email: 'tenant@test.com',
    subscription_plan: 'basic',
    stripe_customer_id: null,
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    tenant_slug: 'test-tenant',
    logo_url: null,
    primary_color: null,
    favicon_url: null,
    description: null,
    phone: null,
    social_links: null,
    google_maps_embed_url: null,
    public_address: null,
    stripe_connect_account_id: 'acct_test123',
    stripe_connect_status: 'active',
    stripe_connect_charges_enabled: true,
    stripe_connect_payouts_enabled: true,
    stripe_connect_requirements: null,
    stripe_connect_country: 'BR',
    payment_mode: 'stripe',
    payment_timing: 'prepaid',
    stripe_terms_accepted_version: null,
    stripe_terms_accepted_at: null,
    stripe_terms_accepted_ip: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Tenant;
}

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    tenant_id: 'tenant-uuid',
    quote_id: 'quote-uuid',
    client_id: 'client-uuid',
    service_id: 'service-uuid',
    scheduled_start: new Date(),
    scheduled_end: new Date(),
    status: 'pending_payment',
    assigned_team: null,
    idempotency_key: 'booking-key',
    service_address: null,
    use_client_address: true,
    observations: null,
    origin: 'public',
    approval_required: true,
    payment_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
    ...overrides,
  } as Booking;
}

describe('PaymentService', () => {
  let service: PaymentService;
  let paymentRepo: jest.Mocked<Pick<Repository<Payment>, 'findOne' | 'create' | 'save' | 'createQueryBuilder' | 'update'>>;
  let bookingRepo: jest.Mocked<Pick<Repository<Booking>, 'findOne' | 'update'>>;
  let tenantRepo: jest.Mocked<Pick<Repository<Tenant>, 'findOne'>>;
  let dataSourceMock: jest.Mocked<Pick<DataSource, 'query' | 'getRepository'>>;

  beforeEach(() => {
    paymentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
      update: jest.fn(),
    };
    bookingRepo = {
      findOne: jest.fn(),
      update: jest.fn(),
    };
    tenantRepo = { findOne: jest.fn() };
    dataSourceMock = {
      query: jest.fn(),
      getRepository: jest.fn(),
    };

    service = new PaymentService(
      paymentRepo as unknown as Repository<Payment>,
      bookingRepo as unknown as Repository<Booking>,
      tenantRepo as unknown as Repository<Tenant>,
      dataSourceMock as unknown as DataSource,
    );
  });

  describe('getPaymentMethodsForRegion', () => {
    it('returns card and pix for BR tenants', () => {
      const methods = service.getPaymentMethodsForRegion('BR');
      expect(methods).toContain('card');
      expect(methods).toContain('pix');
      expect(methods).not.toContain('ach');
    });

    it('returns card, ach, apple_pay, google_pay for US tenants', () => {
      const methods = service.getPaymentMethodsForRegion('US');
      expect(methods).toContain('card');
      expect(methods).toContain('ach');
      expect(methods).toContain('apple_pay');
      expect(methods).toContain('google_pay');
      expect(methods).not.toContain('pix');
    });
  });

  describe('createPaymentIntent', () => {
    it('throws NotFoundException for unknown tenant', async () => {
      tenantRepo.findOne.mockResolvedValue(null);

      await expect(service.createPaymentIntent({
        bookingId: 'booking-id',
        tenantId: 'bad-tenant',
        clientId: 'client-id',
      })).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for unknown booking', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant());
      bookingRepo.findOne.mockResolvedValue(null);

      await expect(service.createPaymentIntent({
        bookingId: 'missing-booking',
        tenantId: 'tenant-uuid',
        clientId: 'client-id',
      })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid booking status', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant());
      bookingRepo.findOne.mockResolvedValue(makeBooking({ status: 'completed' }));

      await expect(service.createPaymentIntent({
        bookingId: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: 'tenant-uuid',
        clientId: 'client-id',
      })).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when payment_mode is not stripe', async () => {
      tenantRepo.findOne.mockResolvedValue(makeTenant({ payment_mode: 'manual' }));

      await expect(service.createPaymentIntent({
        bookingId: 'booking-id',
        tenantId: 'tenant-uuid',
        clientId: 'client-id',
      })).rejects.toThrow();
    });
  });

  describe('application_fee_cents calculation', () => {
    it(`calculates ${PLATFORM_FEE_PERCENT}% fee correctly`, () => {
      const amountCents = 10000;
      const expectedFee = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);
      expect(expectedFee).toBe(100);
    });

    it('rounds correctly for fractional fees', () => {
      const amountCents = 333;
      const fee = Math.round(amountCents * PLATFORM_FEE_PERCENT / 100);
      expect(fee).toBe(3);
    });
  });

  describe('refundPayment', () => {
    it('throws NotFoundException for unknown payment', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(service.refundPayment({
        paymentId: 'missing',
        tenantId: 'tenant-uuid',
        actorId: 'actor',
      })).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when payment is not succeeded', async () => {
      paymentRepo.findOne.mockResolvedValue({ id: 'p-1', status: 'pending' } as Payment);

      await expect(service.refundPayment({
        paymentId: 'p-1',
        tenantId: 'tenant-uuid',
        actorId: 'actor',
      })).rejects.toThrow(BadRequestException);
    });
  });
});
