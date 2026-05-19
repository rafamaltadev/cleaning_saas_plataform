import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../common/decorators/public.decorator';
import { PublicAuthService } from '../application/public-auth.service';
import { GoogleStrategy } from '../strategies/google.strategy';
import { FacebookStrategy } from '../strategies/facebook.strategy';
import { PublicRegisterDto } from '../validation/public-register.dto';
import { PublicLoginDto } from '../validation/public-login.dto';

const PUBLIC_AUTH_THROTTLE = { default: { limit: 10, ttl: 60000 } };

@ApiTags('public-auth')
@Controller('v1/public')
@Public()
export class PublicAuthController {
  private readonly logger = new Logger(PublicAuthController.name);

  constructor(
    private readonly publicAuthService: PublicAuthService,
    private readonly googleStrategy: GoogleStrategy,
    private readonly facebookStrategy: FacebookStrategy,
    private readonly config: ConfigService,
  ) {}

  @Post(':tenantSlug/auth/register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Register a client account scoped to tenant' })
  async register(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: PublicRegisterDto,
  ) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'PASSWORD_MISMATCH', message: 'As senhas não conferem' });
    }
    return this.publicAuthService.register(tenantSlug, dto.name, dto.email, dto.password, dto.phone);
  }

  @Post(':tenantSlug/auth/login')
  @HttpCode(HttpStatus.OK)
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Login as client (clients only)' })
  async login(
    @Param('tenantSlug') tenantSlug: string,
    @Body() dto: PublicLoginDto,
  ) {
    return this.publicAuthService.loginAsClient(tenantSlug, dto.email, dto.password);
  }

  @Get(':tenantSlug/auth/google')
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Initiate Google OAuth flow' })
  googleAuth(
    @Param('tenantSlug') tenantSlug: string,
    @Res() res: Response,
  ) {
    if (!this.googleStrategy.enabled) {
      throw new ServiceUnavailableException({ code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth não configurado' });
    }
    const url = this.googleStrategy.getAuthUrl(tenantSlug);
    res.redirect(url);
  }

  @Get(':tenantSlug/auth/google/callback')
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Google OAuth callback' })
  async googleCallback(
    @Param('tenantSlug') tenantSlug: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Res() res: Response,
  ) {
    if (!this.googleStrategy.enabled) {
      throw new ServiceUnavailableException({ code: 'OAUTH_NOT_CONFIGURED', message: 'Google OAuth não configurado' });
    }
    if (oauthError) {
      this.logger.warn(`Google OAuth error for tenant ${tenantSlug}: ${oauthError}`);
      return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'google_oauth_error'));
    }
    if (!code || !state) {
      throw new BadRequestException({ code: 'MISSING_PARAMS', message: 'Missing code or state' });
    }

    let parsedState: { tenantSlug: string };
    try {
      parsedState = this.googleStrategy.parseState(state);
    } catch {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Invalid state parameter' });
    }
    if (parsedState.tenantSlug !== tenantSlug) {
      throw new BadRequestException({ code: 'STATE_MISMATCH', message: 'State tenantSlug mismatch' });
    }

    try {
      const callbackUrl = this.googleStrategy.getCallbackUrl(tenantSlug);
      const profile = await this.googleStrategy.exchangeCodeForProfile(code, callbackUrl);
      const tokens = await this.publicAuthService.handleOAuthUser(tenantSlug, 'google', profile);
      return res.redirect(this.buildFrontendSuccessUrl(tenantSlug, tokens.accessToken));
    } catch (err) {
      this.logger.error(`Google OAuth callback error: ${String(err)}`);
      if (err instanceof NotFoundException) {
        return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'tenant_not_found'));
      }
      return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'oauth_failed'));
    }
  }

  @Get(':tenantSlug/auth/facebook')
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Initiate Facebook OAuth flow' })
  facebookAuth(
    @Param('tenantSlug') tenantSlug: string,
    @Res() res: Response,
  ) {
    if (!this.facebookStrategy.enabled) {
      throw new ServiceUnavailableException({ code: 'OAUTH_NOT_CONFIGURED', message: 'Facebook OAuth não configurado' });
    }
    const url = this.facebookStrategy.getAuthUrl(tenantSlug);
    res.redirect(url);
  }

  @Get(':tenantSlug/auth/facebook/callback')
  @Throttle(PUBLIC_AUTH_THROTTLE)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  async facebookCallback(
    @Param('tenantSlug') tenantSlug: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') oauthError: string,
    @Res() res: Response,
  ) {
    if (!this.facebookStrategy.enabled) {
      throw new ServiceUnavailableException({ code: 'OAUTH_NOT_CONFIGURED', message: 'Facebook OAuth não configurado' });
    }
    if (oauthError) {
      this.logger.warn(`Facebook OAuth error for tenant ${tenantSlug}: ${oauthError}`);
      return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'facebook_oauth_error'));
    }
    if (!code || !state) {
      throw new BadRequestException({ code: 'MISSING_PARAMS', message: 'Missing code or state' });
    }

    let parsedState: { tenantSlug: string };
    try {
      parsedState = this.facebookStrategy.parseState(state);
    } catch {
      throw new BadRequestException({ code: 'INVALID_STATE', message: 'Invalid state parameter' });
    }
    if (parsedState.tenantSlug !== tenantSlug) {
      throw new BadRequestException({ code: 'STATE_MISMATCH', message: 'State tenantSlug mismatch' });
    }

    try {
      const callbackUrl = this.facebookStrategy.getCallbackUrl(tenantSlug);
      const profile = await this.facebookStrategy.exchangeCodeForProfile(code, callbackUrl);
      const tokens = await this.publicAuthService.handleOAuthUser(tenantSlug, 'facebook', profile);
      return res.redirect(this.buildFrontendSuccessUrl(tenantSlug, tokens.accessToken));
    } catch (err) {
      this.logger.error(`Facebook OAuth callback error: ${String(err)}`);
      if (err instanceof NotFoundException) {
        return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'tenant_not_found'));
      }
      return res.redirect(this.buildFrontendErrorUrl(tenantSlug, 'oauth_failed'));
    }
  }

  // The @Req() parameter is available when needed for IP/UA logging in future
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getClientIp(_req: Request): string {
    return '';
  }

  private buildFrontendSuccessUrl(tenantSlug: string, accessToken: string): string {
    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:5173';
    return `${frontendUrl}/t/${tenantSlug}/orcamento/cadastro?oauth_token=${encodeURIComponent(accessToken)}`;
  }

  private buildFrontendErrorUrl(tenantSlug: string, errorCode: string): string {
    const frontendUrl = this.config.get<string>('frontendUrl') ?? 'http://localhost:5173';
    return `${frontendUrl}/t/${tenantSlug}/orcamento/cadastro?oauth_error=${errorCode}`;
  }
}
