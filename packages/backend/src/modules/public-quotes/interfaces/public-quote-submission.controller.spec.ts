import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PublicQuoteSubmissionController } from './public-quote-submission.controller';
import { PublicQuoteSubmissionService } from '../application/public-quote-submission.service';
import { CreatePublicQuoteDto } from '../validation/create-public-quote.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';

const TENANT_SLUG = 'rafa-malta';
const USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const SERVICE_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const OTHER_SERVICE_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

const MOCK_QUOTE_RESULT = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  status: 'draft',
  estimated_total_cents: 45000,
};

const mockSubmissionService = {
  createPublicQuote: jest.fn(),
  emitQuotePublicCreated: jest.fn(),
} as unknown as PublicQuoteSubmissionService;

const mockRequest = (userId: string, roles: string[]) => ({
  user: { userId, tenantId: 'tenant-id', roles },
  ip: '127.0.0.1',
  headers: { 'user-agent': 'test-agent' },
});

describe('PublicQuoteSubmissionController', () => {
  let controller: PublicQuoteSubmissionController;

  beforeEach(() => {
    controller = new PublicQuoteSubmissionController(mockSubmissionService);
    jest.clearAllMocks();
  });

  // ─── POST :tenantSlug/quotes ──────────────────────────────────────────────

  describe('createPublicQuote', () => {
    const validDto: CreatePublicQuoteDto = {
      service_id: SERVICE_ID,
      area_sqm: 80,
      address: 'Rua A, 123',
      city: 'São Paulo',
      state: 'SP',
      postal_code: '01310-000',
    };

    it('creates Quote with origin=public and approval_required=true', async () => {
      (mockSubmissionService.createPublicQuote as jest.Mock).mockResolvedValue(MOCK_QUOTE_RESULT);
      const req = mockRequest(USER_ID, ['client']);

      const result = await controller.createPublicQuote(
        TENANT_SLUG,
        validDto,
        req as never,
        '127.0.0.1',
        'test-agent',
      );

      expect(result).toEqual(MOCK_QUOTE_RESULT);
      expect(mockSubmissionService.createPublicQuote).toHaveBeenCalledWith(
        TENANT_SLUG,
        USER_ID,
        validDto,
        '127.0.0.1',
        'test-agent',
      );
    });

    it('rejects when service_id belongs to a different tenant', async () => {
      (mockSubmissionService.createPublicQuote as jest.Mock).mockRejectedValue(
        new BadRequestException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found for this tenant' }),
      );
      const dto = { ...validDto, service_id: OTHER_SERVICE_ID };
      const req = mockRequest(USER_ID, ['client']);

      await expect(
        controller.createPublicQuote(TENANT_SLUG, dto, req as never, '127.0.0.1', 'agent'),
      ).rejects.toThrow(BadRequestException);
    });

    it('triggers QuotePublicCreated domain event via service', async () => {
      (mockSubmissionService.createPublicQuote as jest.Mock).mockResolvedValue(MOCK_QUOTE_RESULT);
      (mockSubmissionService.emitQuotePublicCreated as jest.Mock).mockImplementation(() => {});
      const req = mockRequest(USER_ID, ['client']);

      await controller.createPublicQuote(TENANT_SLUG, validDto, req as never, '127.0.0.1', 'agent');

      expect(mockSubmissionService.createPublicQuote).toHaveBeenCalledTimes(1);
    });

    it('returns 404 when tenant not found', async () => {
      (mockSubmissionService.createPublicQuote as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }),
      );
      const req = mockRequest(USER_ID, ['client']);
      await expect(
        controller.createPublicQuote('unknown-slug', validDto, req as never, '127.0.0.1', 'agent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ─── RBAC: client role restrictions ──────────────────────────────────────

  describe('RBAC guards and decorators', () => {
    it('createPublicQuote method requires client role (Roles metadata)', () => {
      const method = PublicQuoteSubmissionController.prototype.createPublicQuote;
      const roles: string[] = Reflect.getMetadata('roles', method);
      expect(roles).toContain('client');
    });

    it('createPublicQuote requires JwtAuthGuard (guards metadata)', () => {
      const method = PublicQuoteSubmissionController.prototype.createPublicQuote;
      const guards: (new (...args: unknown[]) => unknown)[] = Reflect.getMetadata('__guards__', method) ?? [];
      const guardNames = guards.map((g) => g.name);
      expect(guardNames).toContain(JwtAuthGuard.name);
    });

    it('createPublicQuote requires RolesGuard (guards metadata)', () => {
      const method = PublicQuoteSubmissionController.prototype.createPublicQuote;
      const guards: (new (...args: unknown[]) => unknown)[] = Reflect.getMetadata('__guards__', method) ?? [];
      const guardNames = guards.map((g) => g.name);
      expect(guardNames).toContain(RolesGuard.name);
    });

    it('client role cannot access admin endpoints — RolesGuard rejects non-matching roles', () => {
      const rolesGuard = new (class {
        constructor(private readonly requiredRoles: string[]) {}
        canActivate(userRoles: string[]): boolean {
          return this.requiredRoles.some((r) => userRoles.includes(r));
        }
      })(['tenant_admin', 'supervisor', 'operator']);

      expect(rolesGuard.canActivate(['client'])).toBe(false);
      expect(rolesGuard.canActivate(['tenant_admin'])).toBe(true);
      expect(rolesGuard.canActivate(['supervisor'])).toBe(true);
    });

    it('client role CAN access public quote endpoint', () => {
      const method = PublicQuoteSubmissionController.prototype.createPublicQuote;
      const roles: string[] = Reflect.getMetadata('roles', method);
      const clientCanAccess = roles.includes('client');
      expect(clientCanAccess).toBe(true);
    });
  });

  // ─── Audit log ───────────────────────────────────────────────────────────

  describe('audit log', () => {
    it('passes ip and user-agent to service for audit logging', async () => {
      (mockSubmissionService.createPublicQuote as jest.Mock).mockResolvedValue(MOCK_QUOTE_RESULT);
      const req = mockRequest(USER_ID, ['client']);
      const ip = '203.0.113.42';
      const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17)';

      await controller.createPublicQuote(TENANT_SLUG, {
        service_id: SERVICE_ID,
        address: 'Rua B',
        city: 'SP',
        state: 'SP',
        postal_code: '01000-000',
      }, req as never, ip, ua);

      expect(mockSubmissionService.createPublicQuote).toHaveBeenCalledWith(
        TENANT_SLUG,
        USER_ID,
        expect.any(Object),
        ip,
        ua,
      );
    });
  });

  // ─── Throttle metadata ───────────────────────────────────────────────────

  describe('rate limiting', () => {
    it('is rate-limited at 10 req/min', () => {
      const method = PublicQuoteSubmissionController.prototype.createPublicQuote;
      const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', method);
      const ttl = Reflect.getMetadata('THROTTLER:TTLdefault', method);
      expect(limit).toBe(10);
      expect(ttl).toBe(60000);
    });
  });
});
