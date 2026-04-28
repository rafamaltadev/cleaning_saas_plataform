import { AuthController } from './auth.controller';
import { AuthService } from '../application/auth.service';

const mockAuthService = {
  login: jest.fn(),
  refresh: jest.fn(),
  logout: jest.fn(),
} as unknown as AuthService;

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(() => {
    controller = new AuthController(mockAuthService);
    jest.clearAllMocks();
  });

  it('login() delegates to authService.login with email and password', async () => {
    const result = { accessToken: 'at', refreshToken: 'rt' };
    (mockAuthService.login as jest.Mock).mockResolvedValue(result);

    const response = await controller.login({ email: 'a@b.com', password: 'pass' });

    expect(mockAuthService.login).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(response).toBe(result);
  });

  it('refresh() delegates to authService.refresh with refreshToken', async () => {
    const result = { accessToken: 'new-at', refreshToken: 'new-rt' };
    (mockAuthService.refresh as jest.Mock).mockResolvedValue(result);

    const response = await controller.refresh({ refreshToken: 'old-rt' });

    expect(mockAuthService.refresh).toHaveBeenCalledWith('old-rt');
    expect(response).toBe(result);
  });

  it('logout() delegates to authService.logout and returns null', async () => {
    (mockAuthService.logout as jest.Mock).mockResolvedValue(undefined);

    const response = await controller.logout({ refreshToken: 'rt' });

    expect(mockAuthService.logout).toHaveBeenCalledWith('rt');
    expect(response).toBeNull();
  });
});
