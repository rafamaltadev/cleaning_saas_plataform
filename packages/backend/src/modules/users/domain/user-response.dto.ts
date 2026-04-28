import { User } from '../../auth/domain/user.entity';

export class UserResponseDto {
  id: string;
  tenant_id: string;
  email: string;
  roles: string[];
  first_name: string;
  last_name: string;
  created_at: Date;
  updated_at: Date;

  static from(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.tenant_id = user.tenant_id;
    dto.email = user.email;
    dto.roles = user.roles;
    dto.first_name = user.first_name;
    dto.last_name = user.last_name;
    dto.created_at = user.created_at;
    dto.updated_at = user.updated_at;
    return dto;
  }
}
