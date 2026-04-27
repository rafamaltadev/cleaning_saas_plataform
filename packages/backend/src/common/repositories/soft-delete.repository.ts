import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';

export interface FindOptions {
  withDeleted?: boolean;
}

export abstract class SoftDeleteRepository<
  T extends { deleted_at?: Date | null; id: string; tenant_id: string },
> {
  constructor(protected readonly repository: Repository<T>) {}

  protected buildBaseQuery(
    alias: string,
    options?: FindOptions,
  ): SelectQueryBuilder<T> {
    const qb = this.repository.createQueryBuilder(alias);
    if (!options?.withDeleted) {
      qb.where(`${alias}.deleted_at IS NULL`);
    }
    return qb;
  }

  async findById(
    id: string,
    tenantId: string,
    options?: FindOptions,
  ): Promise<T | null> {
    return this.buildBaseQuery('entity', options)
      .andWhere('entity.id = :id', { id })
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .getOne();
  }

  async findAll(
    tenantId: string,
    _filters?: Record<string, unknown>,
    options?: FindOptions,
  ): Promise<T[]> {
    return this.buildBaseQuery('entity', options)
      .andWhere('entity.tenant_id = :tenantId', { tenantId })
      .getMany();
  }

  async save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity as DeepPartial<T> & T);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .set({ deleted_at: new Date() } as any)
      .where('id = :id', { id })
      .execute();
  }
}
