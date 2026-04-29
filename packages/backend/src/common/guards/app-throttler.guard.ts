import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Request & { user?: AuthUser }): Promise<string> {
    const userId = req.user?.userId;
    return userId ?? (req.ip as string);
  }
}
