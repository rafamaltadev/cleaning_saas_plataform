import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

@Injectable()
export class InvoiceNumberService {
  async generate(tenantId: string, manager: EntityManager): Promise<string> {
    // Advisory lock scoped to this transaction prevents duplicate invoice numbers
    // under concurrent requests for the same tenant
    await manager.query(
      `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
      [tenantId],
    );

    const result = await manager.query(
      `SELECT COUNT(*)::int AS cnt FROM invoices WHERE tenant_id = $1`,
      [tenantId],
    );

    const count: number = result[0]?.cnt ?? 0;
    const nextNumber = count + 1;
    return `INV-${String(nextNumber).padStart(4, '0')}`;
  }
}
