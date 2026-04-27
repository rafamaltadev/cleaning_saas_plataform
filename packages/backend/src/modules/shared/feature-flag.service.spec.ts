import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { FeatureFlagService } from './feature-flag.service';

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let mockDataSource: { query: jest.Mock };

  beforeEach(async () => {
    mockDataSource = { query: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagService,
        { provide: getDataSourceToken(), useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<FeatureFlagService>(FeatureFlagService);
  });

  it('returns true for a flag record with enabled = true for the given tenant_id', async () => {
    mockDataSource.query.mockResolvedValue([{ enabled: true }]);

    const result = await service.isEnabled('tenant-1', 'sms_notifications');

    expect(result).toBe(true);
  });

  it('returns false for a flag record with enabled = false', async () => {
    mockDataSource.query.mockResolvedValue([{ enabled: false }]);

    const result = await service.isEnabled('tenant-1', 'sms_notifications');

    expect(result).toBe(false);
  });

  it('returns false when no record exists for the given tenant_id and feature name', async () => {
    mockDataSource.query.mockResolvedValue([]);

    const result = await service.isEnabled('tenant-1', 'nonexistent_feature');

    expect(result).toBe(false);
  });

  it('returns false when query returns null', async () => {
    mockDataSource.query.mockResolvedValue(null);

    const result = await service.isEnabled('tenant-1', 'some_feature');

    expect(result).toBe(false);
  });

  it('queries with the correct tenant_id and feature_name parameters', async () => {
    mockDataSource.query.mockResolvedValue([]);

    await service.isEnabled('my-tenant', 'my-feature');

    expect(mockDataSource.query).toHaveBeenCalledWith(
      expect.stringContaining('tenant_feature_flags'),
      ['my-tenant', 'my-feature'],
    );
  });

  it('filters out soft-deleted flags (query includes deleted_at IS NULL)', async () => {
    mockDataSource.query.mockResolvedValue([]);

    await service.isEnabled('tenant-1', 'feature-x');

    const [sql] = mockDataSource.query.mock.calls[0];
    expect(sql).toContain('deleted_at IS NULL');
  });
});
