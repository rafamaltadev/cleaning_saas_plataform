import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// Installed per T20 requirements — provides OAuth2 profile types
// eslint-disable-next-line @typescript-eslint/no-require-imports
import type { Profile } from 'passport-facebook';
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

function httpsGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options: https.RequestOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers,
    };
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
export class FacebookStrategy {
  private readonly logger = new Logger(FacebookStrategy.name);
  readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const appId = config.get<string>('facebook.appId');
    const appSecret = config.get<string>('facebook.appSecret');
    this.enabled = !!(appId && appSecret);
    if (!this.enabled) {
      this.logger.warn('Facebook OAuth credentials not configured — /auth/facebook endpoints will return 501');
    }
  }

  buildState(tenantSlug: string): string {
    return Buffer.from(JSON.stringify({ tenantSlug, nonce: crypto.randomUUID() })).toString('base64url');
  }

  parseState(state: string): { tenantSlug: string; nonce: string } {
    return JSON.parse(Buffer.from(state, 'base64url').toString('utf-8')) as { tenantSlug: string; nonce: string };
  }

  getCallbackUrl(tenantSlug: string): string {
    const base = this.config.get<string>('facebook.callbackUrl') ?? 'http://localhost:3000/api/v1/public';
    return `${base}/${tenantSlug}/auth/facebook/callback`;
  }

  getAuthUrl(tenantSlug: string): string {
    const appId = this.config.get<string>('facebook.appId') ?? '';
    const callbackUrl = this.getCallbackUrl(tenantSlug);
    const state = this.buildState(tenantSlug);
    const params = new URLSearchParams({
      client_id: appId,
      redirect_uri: callbackUrl,
      response_type: 'code',
      scope: 'email,public_profile',
      state,
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async exchangeCodeForProfile(code: string, callbackUrl: string): Promise<OAuthProfile> {
    const appId = this.config.get<string>('facebook.appId') ?? '';
    const appSecret = this.config.get<string>('facebook.appSecret') ?? '';

    const tokenParams = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: callbackUrl,
      code,
    });
    const tokenRaw = await httpsGet(
      `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`,
    );

    const tokenData = JSON.parse(tokenRaw) as { access_token?: string; error?: { message?: string } };
    if (!tokenData.access_token) {
      throw new Error(`Facebook token exchange failed: ${tokenData.error?.message ?? 'unknown error'}`);
    }

    const profileParams = new URLSearchParams({
      access_token: tokenData.access_token,
      fields: 'id,email,first_name,last_name',
    });
    const profileRaw = await httpsGet(
      `https://graph.facebook.com/v19.0/me?${profileParams.toString()}`,
    );

    const profile = JSON.parse(profileRaw) as {
      id?: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };

    return {
      providerId: profile.id ?? '',
      email: profile.email ?? '',
      firstName: profile.first_name ?? '',
      lastName: profile.last_name ?? '',
      emailVerified: false,
    };
  }
}
