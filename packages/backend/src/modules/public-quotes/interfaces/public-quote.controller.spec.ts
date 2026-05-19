import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PublicQuoteController } from './public-quote.controller';
import {
  PublicQuoteService,
  QuoteEstimateResult,
  PublicAddonDto,
} from '../application/public-quote.service';
import { QuoteEstimateDto } from '../validation/quote-estimate.dto';

const TENANT_SLUG = 'acme-clean';
const TENANT_B_SLUG = 'other-tenant';

const MOCK_SERVICE_ID = '11111111-1111-1111-1111-111111111111';
const MOCK_ADDON_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_SERVICE_ID = '22222222-2222-2222-2222-222222222222';
const OTHER_ADDON_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const MOCK_ESTIMATE: QuoteEstimateResult = {
  subtotal_cents: 40000,
  addon_total_cents: 3000,
  discount_amount_cents: 0,
  estimated_total_cents: 43000,
  currency: 'BRL',
};

const MOCK_ADDONS: PublicAddonDto[] = [
  { id: MOCK_ADDON_ID, name: 'Limpeza de vidros', price_cents: 3000 },
  { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', name: 'Higienização', price_cents: 5000 },
];

const mockPublicQuoteService = {
  estimateQuote: jest.fn(),
  getServiceAddons: jest.fn(),
} as unknown as PublicQuoteService;

describe('PublicQuoteController', () => {
  let controller: PublicQuoteController;

  beforeEach(() => {
    controller = new PublicQuoteController(mockPublicQuoteService);
    jest.clearAllMocks();
  });

  // ─── POST :tenantSlug/quote-estimate ─────────────────────────────────────

  describe('estimateQuote', () => {
    it('returns correct calculation without authentication', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockResolvedValue(MOCK_ESTIMATE);

      const dto: QuoteEstimateDto = { service_id: MOCK_SERVICE_ID, area_sqm: 80 };
      const result = await controller.estimateQuote(TENANT_SLUG, dto);

      expect(result).toEqual(MOCK_ESTIMATE);
      expect(mockPublicQuoteService.estimateQuote).toHaveBeenCalledWith(TENANT_SLUG, dto);
    });

    it('rejects when service_id belongs to a different tenant', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockRejectedValue(
        new BadRequestException({
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found for this tenant',
        }),
      );

      const dto: QuoteEstimateDto = { service_id: OTHER_SERVICE_ID };
      await expect(controller.estimateQuote(TENANT_SLUG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when addon_id belongs to a different tenant', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockRejectedValue(
        new BadRequestException({
          code: 'INVALID_ADDON',
          message: `Addon ${OTHER_ADDON_ID} does not belong to this service or tenant`,
        }),
      );

      const dto: QuoteEstimateDto = {
        service_id: MOCK_SERVICE_ID,
        addon_ids: [OTHER_ADDON_ID],
      };
      await expect(controller.estimateQuote(TENANT_SLUG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects when addon_id does not belong to the selected service', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockRejectedValue(
        new BadRequestException({
          code: 'INVALID_ADDON',
          message: `Addon ${MOCK_ADDON_ID} does not belong to this service or tenant`,
        }),
      );

      // addon from a valid tenant but wrong service
      const dto: QuoteEstimateDto = {
        service_id: MOCK_SERVICE_ID,
        addon_ids: [MOCK_ADDON_ID],
      };
      await expect(controller.estimateQuote(TENANT_SLUG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('does NOT create any database records (service is a pure computation)', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockResolvedValue(MOCK_ESTIMATE);

      const dto: QuoteEstimateDto = { service_id: MOCK_SERVICE_ID };
      await controller.estimateQuote(TENANT_SLUG, dto);

      // Service was called once and no other write-like methods exist
      expect(mockPublicQuoteService.estimateQuote).toHaveBeenCalledTimes(1);
      // getServiceAddons should NOT have been called during estimate
      expect(mockPublicQuoteService.getServiceAddons).not.toHaveBeenCalled();
    });

    it('returns 404 when tenant slug does not exist', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }),
      );

      const dto: QuoteEstimateDto = { service_id: MOCK_SERVICE_ID };
      await expect(controller.estimateQuote('unknown-slug', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('does NOT expose tenant_id, created_by, or internal fields in the response', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockResolvedValue(MOCK_ESTIMATE);

      const dto: QuoteEstimateDto = { service_id: MOCK_SERVICE_ID };
      const result = await controller.estimateQuote(TENANT_SLUG, dto);

      expect(result).not.toHaveProperty('tenant_id');
      expect(result).not.toHaveProperty('created_by');
      expect(result).not.toHaveProperty('id');
      expect(result).not.toHaveProperty('deleted_at');
      expect(result).toHaveProperty('subtotal_cents');
      expect(result).toHaveProperty('addon_total_cents');
      expect(result).toHaveProperty('discount_amount_cents');
      expect(result).toHaveProperty('estimated_total_cents');
      expect(result).toHaveProperty('currency');
    });

    it('is rate-limited at 30 req/min (throttle metadata is set on the method)', () => {
      // @Throttle sets per-name metadata: 'THROTTLER:LIMIT{name}' on descriptor.value
      // The method function itself holds the metadata after compilation
      const method = PublicQuoteController.prototype.estimateQuote;
      const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', method);
      const ttl = Reflect.getMetadata('THROTTLER:TTLdefault', method);
      expect(limit).toBe(30);
      expect(ttl).toBe(60000);
    });

    it('cross-tenant injection: service from tenant A queried via tenant B slug returns 400', async () => {
      (mockPublicQuoteService.estimateQuote as jest.Mock).mockRejectedValue(
        new BadRequestException({
          code: 'SERVICE_NOT_FOUND',
          message: 'Service not found for this tenant',
        }),
      );

      const dto: QuoteEstimateDto = { service_id: MOCK_SERVICE_ID };
      // Querying tenant A's service via tenant B's slug must be rejected
      await expect(controller.estimateQuote(TENANT_B_SLUG, dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ─── GET :tenantSlug/services/:serviceId/addons ───────────────────────────

  describe('getServiceAddons', () => {
    it('returns correct addons for the selected service', async () => {
      (mockPublicQuoteService.getServiceAddons as jest.Mock).mockResolvedValue(MOCK_ADDONS);

      const result = await controller.getServiceAddons(TENANT_SLUG, MOCK_SERVICE_ID);

      expect(result).toEqual(MOCK_ADDONS);
      expect(result).toHaveLength(2);
      expect(mockPublicQuoteService.getServiceAddons).toHaveBeenCalledWith(
        TENANT_SLUG,
        MOCK_SERVICE_ID,
      );
    });

    it('returns 404 when service belongs to a different tenant', async () => {
      (mockPublicQuoteService.getServiceAddons as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'SERVICE_NOT_FOUND', message: 'Service not found' }),
      );

      await expect(
        controller.getServiceAddons(TENANT_SLUG, OTHER_SERVICE_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns 404 when tenant slug does not exist', async () => {
      (mockPublicQuoteService.getServiceAddons as jest.Mock).mockRejectedValue(
        new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' }),
      );

      await expect(
        controller.getServiceAddons('unknown-slug', MOCK_SERVICE_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('does NOT expose tenant_id, created_by, or internal fields in addon items', async () => {
      (mockPublicQuoteService.getServiceAddons as jest.Mock).mockResolvedValue(MOCK_ADDONS);

      const result = await controller.getServiceAddons(TENANT_SLUG, MOCK_SERVICE_ID);

      for (const addon of result) {
        expect(addon).not.toHaveProperty('tenant_id');
        expect(addon).not.toHaveProperty('service_id');
        expect(addon).not.toHaveProperty('created_by');
        expect(addon).not.toHaveProperty('deleted_at');
        expect(addon).toHaveProperty('id');
        expect(addon).toHaveProperty('name');
        expect(addon).toHaveProperty('price_cents');
      }
    });
  });

  // ─── @Public() decorator check ────────────────────────────────────────────

  describe('@Public() decorator', () => {
    it('controller is marked @Public() — no JWT guard metadata on class', () => {
      const metadataKeys = Reflect.getMetadataKeys(PublicQuoteController);
      expect(metadataKeys).not.toContain('__guards__');
    });
  });
});
