import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, AuthProvider } from '../domain/user.entity';
import { Client } from '../../clients/domain/client.entity';
import { Tenant } from '../../tenant/domain/tenant.entity';
import { AuthService } from './auth.service';
import { OAuthProfile } from '../strategies/google.strategy';

@Injectable()
export class PublicAuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly authService: AuthService,
  ) {}

  private async resolveTenant(tenantSlug: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { tenant_slug: tenantSlug, deleted_at: IsNull() },
    });
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }
    return tenant;
  }

  async register(
    tenantSlug: string,
    name: string,
    email: string,
    password: string,
    phone: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tenant = await this.resolveTenant(tenantSlug);

    const existing = await this.userRepo.findOne({
      where: { email, tenant_id: tenant.id, deleted_at: IsNull() },
    });
    if (existing) {
      throw new ConflictException({ code: 'EMAIL_IN_USE', message: 'Este e-mail já está em uso' });
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    const passwordHash = await bcrypt.hash(password, 12);

    const user = this.userRepo.create({
      tenant_id: tenant.id,
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      roles: ['client'],
      first_name: firstName,
      last_name: lastName,
      auth_provider: 'local',
      provider_id: null,
      provider_email_verified: false,
    });
    await this.userRepo.save(user);

    await this.clientRepo.save(
      this.clientRepo.create({
        tenant_id: tenant.id,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      }),
    );

    return this.authService.issueTokenPairPublicClient(user);
  }

  async loginAsClient(
    tenantSlug: string,
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tenant = await this.resolveTenant(tenantSlug);

    const user = await this.userRepo.findOne({
      where: { email: email.trim().toLowerCase(), tenant_id: tenant.id, deleted_at: IsNull() },
    });

    if (!user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos' });
    }

    if (!user.roles.includes('client')) {
      throw new ForbiddenException({ code: 'NOT_CLIENT', message: 'Este endpoint é exclusivo para clientes' });
    }

    if (!user.password_hash) {
      throw new UnauthorizedException({
        code: 'OAUTH_ONLY',
        message: 'Esta conta foi criada via login social. Use Google ou Facebook para entrar.',
      });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'E-mail ou senha inválidos' });
    }

    return this.authService.issueTokenPairPublicClient(user);
  }

  async handleOAuthUser(
    tenantSlug: string,
    provider: AuthProvider,
    profile: OAuthProfile,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!profile.email) {
      throw new BadRequestException({ code: 'NO_EMAIL', message: 'O provedor não retornou um e-mail' });
    }

    const tenant = await this.resolveTenant(tenantSlug);

    let user = await this.userRepo.findOne({
      where: { auth_provider: provider, provider_id: profile.providerId, tenant_id: tenant.id, deleted_at: IsNull() },
    });

    if (!user) {
      user = await this.userRepo.findOne({
        where: { email: profile.email.toLowerCase(), tenant_id: tenant.id, deleted_at: IsNull() },
      });

      if (user) {
        user.auth_provider = provider;
        user.provider_id = profile.providerId;
        user.provider_email_verified = profile.emailVerified;
        await this.userRepo.save(user);
      } else {
        const nameParts = `${profile.firstName} ${profile.lastName}`.trim().split(/\s+/);
        user = this.userRepo.create({
          tenant_id: tenant.id,
          email: profile.email.toLowerCase(),
          password_hash: null,
          roles: ['client'],
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(' ') || '-',
          auth_provider: provider,
          provider_id: profile.providerId,
          provider_email_verified: profile.emailVerified,
        });
        await this.userRepo.save(user);

        const existingClient = await this.clientRepo.findOne({
          where: { email: profile.email.toLowerCase(), tenant_id: tenant.id, deleted_at: IsNull() },
        });
        if (!existingClient) {
          await this.clientRepo.save(
            this.clientRepo.create({
              tenant_id: tenant.id,
              name: `${profile.firstName} ${profile.lastName}`.trim() || profile.email,
              email: profile.email.toLowerCase(),
              phone: '',
            }),
          );
        }
      }
    }

    if (!user.roles.includes('client')) {
      throw new ForbiddenException({ code: 'NOT_CLIENT', message: 'Este endpoint é exclusivo para clientes' });
    }

    return this.authService.issueTokenPairPublicClient(user);
  }
}
