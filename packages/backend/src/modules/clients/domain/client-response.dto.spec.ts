import { ClientResponseDto } from './client-response.dto';
import { Client } from './client.entity';

function makeClient(overrides: Partial<Client> = {}): Client {
  return {
    id: 'client-uuid',
    tenant_id: 'tenant-uuid',
    name: 'Test Client',
    email: 'client@test.com',
    phone: '+5511999999999',
    address_id: null,
    preferred_language: 'pt-BR',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: null,
    ...overrides,
  };
}

describe('ClientResponseDto', () => {
  it('maps all expected fields from Client entity', () => {
    const client = makeClient({ address_id: 'addr-uuid' });
    const dto = ClientResponseDto.from(client);

    expect(dto.id).toBe('client-uuid');
    expect(dto.tenant_id).toBe('tenant-uuid');
    expect(dto.name).toBe('Test Client');
    expect(dto.email).toBe('client@test.com');
    expect(dto.phone).toBe('+5511999999999');
    expect(dto.address_id).toBe('addr-uuid');
    expect(dto.preferred_language).toBe('pt-BR');
    expect(dto.created_at).toEqual(new Date('2024-01-01'));
    expect(dto.updated_at).toEqual(new Date('2024-06-01'));
  });

  it('does not include deleted_at', () => {
    const dto = ClientResponseDto.from(makeClient({ deleted_at: new Date() }));
    expect(dto).not.toHaveProperty('deleted_at');
  });

  it('returns an instance of ClientResponseDto', () => {
    expect(ClientResponseDto.from(makeClient())).toBeInstanceOf(ClientResponseDto);
  });

  it('preserves null address_id', () => {
    const dto = ClientResponseDto.from(makeClient({ address_id: null }));
    expect(dto.address_id).toBeNull();
  });
});
