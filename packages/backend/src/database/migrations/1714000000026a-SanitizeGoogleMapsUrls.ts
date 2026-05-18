import { MigrationInterface, QueryRunner } from 'typeorm';

export class SanitizeGoogleMapsUrls1714000000026a implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    const rows: { id: string; google_maps_embed_url: string }[] = await queryRunner.query(`
      SELECT id, google_maps_embed_url
      FROM tenants
      WHERE google_maps_embed_url IS NOT NULL
        AND (google_maps_embed_url LIKE '%"%' OR google_maps_embed_url LIKE '%''%' OR google_maps_embed_url LIKE '% %')
    `);

    for (const row of rows) {
      let url: string = row.google_maps_embed_url.trim();

      if (url.includes('<iframe')) {
        const match = /src=["']([^"']+)["']/.exec(url);
        url = match ? match[1] : '';
      }

      const junkIndex = url.search(/["'\s]/);
      if (junkIndex !== -1) url = url.slice(0, junkIndex);

      const isValid = /^https:\/\/(www\.)?google\.com\/maps\/embed\?/.test(url);

      if (isValid && url.length > 0) {
        await queryRunner.query(
          `UPDATE tenants SET google_maps_embed_url = $1 WHERE id = $2`,
          [url, row.id],
        );
      } else {
        await queryRunner.query(
          `UPDATE tenants SET google_maps_embed_url = NULL WHERE id = $1`,
          [row.id],
        );
      }
    }
  }

  async down(_queryRunner: QueryRunner): Promise<void> {
    // Cannot safely restore corrupted data
  }
}
