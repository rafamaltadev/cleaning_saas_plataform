import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Installed per T20 requirements — provides OAuth2 profile types
// eslint-disable-next-line @typescript-eslint/no-require-imports
import type { Profile } from 'passport-google-oauth20';
import * as crypto from 'crypto';
import * as https from 'https';

export interface OAuthProfile {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
}

// Suppress unused type import — Profile used for documentation only
void ({} as Profile);

function httpsPost(options: https.RequestOptions, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function httpsGet(options: https.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

@Injectable()
export class GoogleStrategy {
  private readonly logger = new Logger(GoogleStrategy.name);
  readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const clientId = config.get<string>('google.clientId');
    const clientSecret = config.get<string>('google.clientSecret');
    this.enabled = !!(clientId && clientSecret);
    if (!this.enabled) {
      this.logger.warn('Google OAuth credentials not configured — /auth/google endpoints will return 501');
    }
  }

  buildState(tenantSlug: string): string {
    return Buffer.from(JSON.stringify({ tenantSlug, nonce: crypto.randomUUID() })).toString('base64url');
  }

  parseState(state: string): { tenantSlug: string; nonce: string } {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as { tenantSlug: string; nonce: string };
  }

  getCallbackUrl(tenantSlug: string): string {
    const base = this.config.get<string>('google.callbackUrl') ?? 'http://localhost:3000/api/v1/public';
    return `${base}/${tenantSlug}/auth/google/callback`;
  }

  getAuthUrl(tenantSlug: string): string {
    const clientId = this.config.get<string>('google.clientId') ?? '';
    const callbackUrl = this.getCallbackUrl(tenantSlug);
    const state = this.buildState(tenantSlug);
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email profile',
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string, callbackUrl: string): Promise<OAuthProfile> {
    const clientId = this.config.get<string>('google.clientId') ?? '';
    const clientSecret = this.config.get<string>('google.clientSecret') ?? '';

    const tokenBody = new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: 'authorization_code',
    }).toString();

    const tokenRaw = await httpsPost(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(tokenBody),
        },
      },
      tokenBody,
    );

    const tokenData = JSON.parse(tokenRaw) as { access_token?: string; error?: string };
    if (!tokenData.access_token) {
      throw new Error(`Google token exchange failed: ${tokenData.error ?? 'unknown error'}`);
    }

    const profileRaw = await httpsGet({
      hostname: 'www.googleapis.com',
      path: '/oauth2/v3/userinfo',
      method: 'GET',
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = JSON.parse(profileRaw) as {
      sub?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
      email_verified?: boolean;
    };

    return {
      providerId: profile.sub ?? '',
      email: profile.email ?? '',
      firstName: profile.given_name ?? '',
      lastName: profile.family_name ?? '',
      emailVerified: profile.email_verified ?? false,
    };
  }
}
