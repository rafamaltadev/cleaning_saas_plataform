import { ROLES_KEY, Roles } from './roles.decorator';

describe('Roles decorator', () => {
  it('sets the ROLES_KEY metadata on the target', () => {
    @Roles('admin', 'staff')
    class TestClass {}

    const metadata = Reflect.getMetadata(ROLES_KEY, TestClass);
    expect(metadata).toEqual(['admin', 'staff']);
  });

  it('ROLES_KEY is the expected string', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
