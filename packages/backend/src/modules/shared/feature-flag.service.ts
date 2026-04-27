import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class FeatureFlagService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async isEnabled(tenantId: string, featureName: string): Promise<boolean> {
    const result: Array<{ enabled: boolean }> = await this.dataSource.query(
      `SELECT enabled FROM tenant_feature_flags
       WHERE tenant_id = $1 AND feature_name = $2 AND deleted_at IS NULL
       LIMIT 1`,
      [tenantId, featureName],
    );
    if (!result || result.length === 0) return false;
    return result[0].enabled === true;
  }
}
