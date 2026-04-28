import { Client } from './client.entity';

export class ClientResponseDto {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  phone: string;
  address_id: string | null;
  preferred_language: string;
  created_at: Date;
  updated_at: Date;

  static from(client: Client): ClientResponseDto {
    const dto = new ClientResponseDto();
    dto.id = client.id;
    dto.tenant_id = client.tenant_id;
    dto.name = client.name;
    dto.email = client.email;
    dto.phone = client.phone;
    dto.address_id = client.address_id;
    dto.preferred_language = client.preferred_language;
    dto.created_at = client.created_at;
    dto.updated_at = client.updated_at;
    return dto;
  }
}
