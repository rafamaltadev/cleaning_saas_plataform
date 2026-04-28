import { UserResponseDto } from './user-response.dto';
import { User } from '../../auth/domain/user.entity';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-uuid',
    tenant_id: 'tenant-uuid',
    email: 'user@example.com',
    password_hash: 'hashed-secret',
    roles: ['tenant_admin'],
    first_name: 'Jane',
    last_name: 'Doe',
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-06-01'),
    deleted_at: new Date('2024-07-01'),
    ...overrides,
  };
}

describe('UserResponseDto', () => {
  describe('from()', () => {
    it('does not expose password_hash', () => {
      const dto = UserResponseDto.from(makeUser());
      expect(dto).not.toHaveProperty('password_hash');
    });

    it('does not expose deleted_at', () => {
      const dto = UserResponseDto.from(makeUser());
      expect(dto).not.toHaveProperty('deleted_at');
    });

    it('maps id', () => {
      const dto = UserResponseDto.from(makeUser({ id: 'my-id' }));
      expect(dto.id).toBe('my-id');
    });

    it('maps tenant_id', () => {
      const dto = UserResponseDto.from(makeUser({ tenant_id: 'my-tenant' }));
      expect(dto.tenant_id).toBe('my-tenant');
    });

    it('maps email', () => {
      const dto = UserResponseDto.from(makeUser({ email: 'hello@test.com' }));
      expect(dto.email).toBe('hello@test.com');
    });

    it('maps roles', () => {
      const dto = UserResponseDto.from(makeUser({ roles: ['staff', 'supervisor'] }));
      expect(dto.roles).toEqual(['staff', 'supervisor']);
    });

    it('maps first_name and last_name', () => {
      const dto = UserResponseDto.from(
        makeUser({ first_name: 'Alice', last_name: 'Smith' }),
      );
      expect(dto.first_name).toBe('Alice');
      expect(dto.last_name).toBe('Smith');
    });

    it('maps created_at and updated_at', () => {
      const created = new Date('2024-01-01');
      const updated = new Date('2024-06-01');
      const dto = UserResponseDto.from(
        makeUser({ created_at: created, updated_at: updated }),
      );
      expect(dto.created_at).toBe(created);
      expect(dto.updated_at).toBe(updated);
    });

    it('returns an instance of UserResponseDto', () => {
      const dto = UserResponseDto.from(makeUser());
      expect(dto).toBeInstanceOf(UserResponseDto);
    });
  });
});
