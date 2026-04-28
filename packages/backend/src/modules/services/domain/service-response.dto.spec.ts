import { ServiceResponseDto } from './service-response.dto';
import { Service } from './service.entity';

function makeService(overrides: Partial<Service> = {}): Service {
  return {
    id: 'service-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Service',
    description: 'A test service',
    base_rate_cents: 1000,
    unit: 'flat',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('ServiceResponseDto', () => {
  it('maps all expected fields from Service entity', () => {
    const svc = makeService();
    const dto = ServiceResponseDto.from(svc);

    expect(dto.id).toBe('service-uuid');
    expect(dto.tenant_id).toBe('tenant-uuid');
    expect(dto.name).toBe('Test Service');
    expect(dto.description).toBe('A test service');
    expect(dto.base_rate_cents).toBe(1000);
    expect(dto.unit).toBe('flat');
    expect(dto.created_at).toEqual(new Date('2024-01-01'));
    expect(dto.updated_at).toEqual(new Date('2024-06-01'));
  });

  it('does not include deleted_at', () => {
    const dto = ServiceResponseDto.from(makeService({ deleted_at: new Date() }));
    expect(dto).not.toHaveProperty('deleted_at');
  });

  it('returns an instance of ServiceResponseDto', () => {
    expect(ServiceResponseDto.from(makeService())).toBeInstanceOf(ServiceResponseDto);
  });
});
