import { Repository } from 'typeorm';
import { TenantRepository } from './tenant.repository';
import { Tenant } from '../domain/tenant.entity';

function makeTenant(overrides: Partial<Tenant> = {}): Tenant {
  const t = new Tenant();
  t.id = 'tenant-uuid';
  t.name = 'Test Tenant';
  t.email = 'test@tenant.local';
  t.subscription_plan = 'basic';
  t.stripe_customer_id = null;
  t.currency = 'BRL';
  t.timezone = 'America/Sao_Paulo';
  t.stripe_connect_account_id = null;
  t.stripe_connect_status = null;
  t.stripe_connect_charges_enabled = false;
  t.stripe_connect_payouts_enabled = false;
  t.stripe_connect_requirements = null;
  t.stripe_connect_country = null;
  t.payment_mode = 'manual';
  t.payment_timing = 'prepaid';
  t.stripe_terms_accepted_version = null;
  t.stripe_terms_accepted_at = null;
  t.stripe_terms_accepted_ip = null;
  t.created_at = new Date();
  t.updated_at = new Date();
  t.deleted_at = null;
  return Object.assign(t, overrides);
}

describe('TenantRepository', () => {
  let tenantRepo: TenantRepository;
  let repoMock: jest.Mocked<Pick<Repository<Tenant>, 'findOne' | 'save'>>;

  beforeEach(() => {
    repoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    tenantRepo = new TenantRepository(
      repoMock as unknown as Repository<Tenant>,
    );
  });

  describe('findById', () => {
    it('calls findOne with id and deleted_at: IsNull()', async () => {
      repoMock.findOne.mockResolvedValue(makeTenant());

      const result = await tenantRepo.findById('tenant-uuid');

      expect(repoMock.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'tenant-uuid' }),
        }),
      );
      expect(result).toBeDefined();
      expect(result?.id).toBe('tenant-uuid');
    });

    it('returns null when tenant does not exist', async () => {
      repoMock.findOne.mockResolvedValue(null);

      const result = await tenantRepo.findById('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('delegates to repository.save and returns the entity', async () => {
      const tenant = makeTenant({ name: 'Updated' });
      repoMock.save.mockResolvedValue(tenant);

      const result = await tenantRepo.save({ name: 'Updated' });

      expect(repoMock.save).toHaveBeenCalled();
      expect(result.name).toBe('Updated');
    });
  });
});
