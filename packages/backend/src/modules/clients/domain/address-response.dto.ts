import { Address } from './address.entity';

export class AddressResponseDto {
  id: string;
  tenant_id: string;
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  created_at: Date;
  updated_at: Date;

  static from(address: Address): AddressResponseDto {
    const dto = new AddressResponseDto();
    dto.id = address.id;
    dto.tenant_id = address.tenant_id;
    dto.street = address.street;
    dto.city = address.city;
    dto.state = address.state;
    dto.postal_code = address.postal_code;
    dto.country = address.country;
    dto.latitude = address.latitude;
    dto.longitude = address.longitude;
    dto.created_at = address.created_at;
    dto.updated_at = address.updated_at;
    return dto;
  }
}
