import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  NotFoundException,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { AuthUser } from '../../../common/interfaces/auth-user.interface';
import { StripeConnectService } from '../stripe/stripe-connect.service';
import { StripeTermsService } from '../connect/stripe-terms.service';
import { AcceptTermsDto } from '../validation/accept-terms.dto';
import { StartOnboardingDto } from '../validation/start-onboarding.dto';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuditLog } from '../../audit-log/domain/audit-log.entity';

@ApiTags('billing')
@ApiBearerAuth()
@Controller('v1/billing/connect')
export class ConnectController {
  private readonly logger = new Logger(ConnectController.name);

  constructor(
    private readonly connectService: StripeConnectService,
    private readonly termsService: StripeTermsService,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get('terms')
  @ApiOperation({ summary: 'Get current Stripe Connect terms (public)' })
  async getTerms(
    @Query('country') country: string,
    @Query('language') language: string,
  ) {
    const c = country ?? 'US';
    const l = language ?? 'en';
    const terms = await this.termsService.getCurrentTerms({ country: c, language: l });
    if (!terms) throw new NotFoundException('No active terms found for this country/language');
    return terms;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_admin')
  @Post('accept-terms')
  @ApiOperation({ summary: 'Accept Stripe Connect terms of service' })
  async acceptTerms(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: AcceptTermsDto,
  ) {
    const user = req.user!;
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.socket.remoteAddress ?? 'unknown';
    const userAgent = req.headers['user-agent'] ?? 'unknown';

    const consent = await this.termsService.recordConsent({
      tenantId: user.tenantId,
      termsVersion: dto.terms_version,
      ip,
      userAgent,
      userId: user.userId,
    });

    await this.logAudit(user.tenantId, user.userId, 'stripe_terms.accepted', 'tenant', user.tenantId);

    return { id: consent.id, accepted_at: consent.accepted_at };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_admin')
  @Post('start-onboarding')
  @ApiOperation({ summary: 'Create Stripe Connect Express account and return onboarding URL' })
  async startOnboarding(
    @Req() req: Request & { user?: AuthUser },
    @Body() dto: StartOnboardingDto,
  ) {
    const user = req.user!;

    const hasConsent = await this.termsService.hasValidConsent(user.tenantId);
    if (!hasConsent) {
      throw new ForbiddenException('You must accept the current terms before onboarding');
    }

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    let accountId = tenant.stripe_connect_account_id;

    if (!accountId) {
      const account = await this.connectService.createConnectAccount({
        tenantId: user.tenantId,
        country: dto.country,
        email: dto.email,
      });
      accountId = account.id;

      await this.dataSource.getRepository(Tenant).update(
        { id: user.tenantId },
        {
          stripe_connect_account_id: accountId,
          stripe_connect_status: account.details_submitted ? 'active' : 'pending',
          stripe_connect_country: dto.country,
        },
      );

      await this.logAudit(user.tenantId, user.userId, 'stripe_connect.account_created', 'tenant', user.tenantId);
    }

    const returnUrl = process.env.STRIPE_CONNECT_RETURN_URL ?? 'http://localhost:5173/settings/payments/connected';
    const refreshUrl = process.env.STRIPE_CONNECT_REFRESH_URL ?? 'http://localhost:5173/settings/payments/refresh';

    const link = await this.connectService.createAccountLink({
      accountId,
      returnUrl,
      refreshUrl,
      type: 'account_onboarding',
    });

    return { url: link.url };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_admin')
  @Get('status')
  @ApiOperation({ summary: 'Get Stripe Connect account status for current tenant' })
  async getStatus(@Req() req: Request & { user?: AuthUser }) {
    const user = req.user!;

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    if (!tenant.stripe_connect_account_id) {
      return {
        connected: false,
        stripe_connect_status: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        payment_mode: tenant.payment_mode,
        payment_timing: tenant.payment_timing,
      };
    }

    let accountData: any = null;
    try {
      accountData = await this.connectService.retrieveAccount(tenant.stripe_connect_account_id);
      await this.dataSource.getRepository(Tenant).update(
        { id: user.tenantId },
        {
          stripe_connect_status: accountData.details_submitted ? 'active' : 'pending',
          stripe_connect_charges_enabled: accountData.charges_enabled ?? false,
          stripe_connect_payouts_enabled: accountData.payouts_enabled ?? false,
          stripe_connect_requirements: accountData.requirements ?? null,
        },
      );
    } catch (err) {
      this.logger.error(`Failed to retrieve Connect account for tenant ${user.tenantId}`, err);
    }

    const updated = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });

    return {
      connected: true,
      stripe_connect_status: updated?.stripe_connect_status,
      stripe_connect_charges_enabled: updated?.stripe_connect_charges_enabled ?? false,
      stripe_connect_payouts_enabled: updated?.stripe_connect_payouts_enabled ?? false,
      stripe_connect_requirements: updated?.stripe_connect_requirements,
      payment_mode: updated?.payment_mode ?? 'manual',
      payment_timing: updated?.payment_timing ?? 'prepaid',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_admin')
  @Post('dashboard-link')
  @ApiOperation({ summary: 'Get Stripe Express dashboard link' })
  async getDashboardLink(@Req() req: Request & { user?: AuthUser }) {
    const user = req.user!;

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });
    if (!tenant?.stripe_connect_account_id) {
      throw new NotFoundException('No Stripe Connect account found');
    }

    const link = await this.connectService.createLoginLink(tenant.stripe_connect_account_id);
    return { url: link.url };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('tenant_admin')
  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect Stripe Connect account' })
  async disconnect(@Req() req: Request & { user?: AuthUser }) {
    const user = req.user!;

    const tenant = await this.dataSource
      .getRepository(Tenant)
      .findOne({ where: { id: user.tenantId } });
    if (!tenant?.stripe_connect_account_id) {
      throw new NotFoundException('No Stripe Connect account to disconnect');
    }

    await this.connectService.disconnectAccount(tenant.stripe_connect_account_id);

    await this.dataSource.getRepository(Tenant).update(
      { id: user.tenantId },
      {
        stripe_connect_account_id: null,
        stripe_connect_status: null,
        stripe_connect_charges_enabled: false,
        stripe_connect_payouts_enabled: false,
        stripe_connect_requirements: null,
      },
    );

    await this.logAudit(user.tenantId, user.userId, 'stripe_connect.account_disconnected', 'tenant', user.tenantId);

    return { disconnected: true };
  }

  private async logAudit(
    tenantId: string,
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
  ): Promise<void> {
    await this.dataSource.getRepository(AuditLog).save({
      tenant_id: tenantId,
      user_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      old_values: null,
      new_values: null,
    }).catch((err) => this.logger.error('Audit log failed', err));
  }
}
