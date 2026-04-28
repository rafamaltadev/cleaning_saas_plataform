import { AddressResponseDto } from './address-response.dto';
import { Address } from './address.entity';

function makeAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: 'addr-uuid',
    tenant_id: 'tenant-uuid',
    street: '123 Main St',
    city: 'São Paulo',
    state: 'SP',
    postal_code: '01310-100',
    country: 'Brazil',
    latitude: -23.5505,
    longitude: -46.6333,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('AddressResponseDto', () => {
  it('maps all expected fields from Address entity', () => {
    const address = makeAddress();
    const dto = AddressResponseDto.from(address);

    expect(dto.id).toBe('addr-uuid');
    expect(dto.tenant_id).toBe('tenant-uuid');
    expect(dto.street).toBe('123 Main St');
    expect(dto.city).toBe('São Paulo');
    expect(dto.state).toBe('SP');
    expect(dto.postal_code).toBe('01310-100');
    expect(dto.country).toBe('Brazil');
    expect(dto.latitude).toBe(-23.5505);
    expect(dto.longitude).toBe(-46.6333);
    expect(dto.created_at).toEqual(new Date('2024-01-01'));
    expect(dto.updated_at).toEqual(new Date('2024-06-01'));
  });

  it('does not include deleted_at', () => {
    const dto = AddressResponseDto.from(makeAddress({ deleted_at: new Date() }));
    expect(dto).not.toHaveProperty('deleted_at');
  });

  it('returns an instance of AddressResponseDto', () => {
    expect(AddressResponseDto.from(makeAddress())).toBeInstanceOf(AddressResponseDto);
  });

  it('preserves null latitude and longitude', () => {
    const dto = AddressResponseDto.from(makeAddress({ latitude: null, longitude: null }));
    expect(dto.latitude).toBeNull();
    expect(dto.longitude).toBeNull();
  });
});
