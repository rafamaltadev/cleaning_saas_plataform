import { InvoiceNumberService } from './invoice-number.service';
import { EntityManager } from 'typeorm';

function makeManagerMock(): jest.Mocked<Pick<EntityManager, 'query'>> {
  return { query: jest.fn() };
}

describe('InvoiceNumberService', () => {
  let service: InvoiceNumberService;
  let managerMock: jest.Mocked<Pick<EntityManager, 'query'>>;

  beforeEach(() => {
    service = new InvoiceNumberService();
    managerMock = makeManagerMock();
  });

  it('generates INV-0001 for the first invoice (count = 0)', async () => {
    managerMock.query
      .mockResolvedValueOnce([{}])       // advisory lock
      .mockResolvedValueOnce([{ cnt: 0 }]); // count query

    const result = await service.generate('tenant-uuid', managerMock as unknown as EntityManager);

    expect(result).toBe('INV-0001');
  });

  it('generates INV-0002 for the second invoice (count = 1)', async () => {
    managerMock.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ cnt: 1 }]);

    const result = await service.generate('tenant-uuid', managerMock as unknown as EntityManager);

    expect(result).toBe('INV-0002');
  });

  it('generates INV-0010 when nine invoices already exist', async () => {
    managerMock.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ cnt: 9 }]);

    const result = await service.generate('tenant-uuid', managerMock as unknown as EntityManager);

    expect(result).toBe('INV-0010');
  });

  it('sequences are per-tenant: tenant A and tenant B both produce INV-0001 independently', async () => {
    const managerA = makeManagerMock();
    const managerB = makeManagerMock();

    managerA.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ cnt: 0 }]);
    managerB.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ cnt: 0 }]);

    const [numA, numB] = await Promise.all([
      service.generate('tenant-a', managerA as unknown as EntityManager),
      service.generate('tenant-b', managerB as unknown as EntityManager),
    ]);

    expect(numA).toBe('INV-0001');
    expect(numB).toBe('INV-0001');
  });

  it('acquires the advisory lock before counting', async () => {
    managerMock.query
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{ cnt: 0 }]);

    await service.generate('tenant-uuid', managerMock as unknown as EntityManager);

    expect(managerMock.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('pg_advisory_xact_lock'),
      ['tenant-uuid'],
    );
    expect(managerMock.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COUNT'),
      ['tenant-uuid'],
    );
  });
});
