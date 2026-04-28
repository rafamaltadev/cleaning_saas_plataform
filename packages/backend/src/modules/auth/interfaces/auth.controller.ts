import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../application/auth.service';
import { LoginDto } from '../validation/login.dto';
import { RefreshDto } from '../validation/refresh.dto';
import { LogoutDto } from '../validation/logout.dto';

@Controller('v1/auth')
@Throttle({ default: { ttl: 60000, limit: 5 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: LogoutDto): Promise<null> {
    await this.authService.logout(dto.refreshToken);
    return null;
  }
}
