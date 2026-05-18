import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixTenantSlugs1714000000025a implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        t RECORD;
        new_slug TEXT;
        conflict_count INTEGER;
      BEGIN
        FOR t IN
          SELECT id, name, tenant_slug
          FROM tenants
          WHERE tenant_slug LIKE 'tenant-%'
            AND deleted_at IS NULL
        LOOP
          -- Slugify: remove non-alphanumeric/non-space chars, collapse spaces to hyphens, lowercase
          new_slug := LOWER(
            REGEXP_REPLACE(
              REGEXP_REPLACE(
                REGEXP_REPLACE(t.name, '[^a-zA-Z0-9\\s]', '', 'g'),
                '\\s+', '-', 'g'
              ),
              '-+', '-', 'g'
            )
          );

          -- Strip leading/trailing hyphens
          new_slug := REGEXP_REPLACE(new_slug, '^-+|-+$', '', 'g');

          -- Skip if slugified result is empty (name was all special chars)
          IF new_slug = '' OR new_slug IS NULL THEN
            CONTINUE;
          END IF;

          -- Skip if the generated slug matches the current fallback exactly
          IF new_slug = t.tenant_slug THEN
            CONTINUE;
          END IF;

          -- Skip if another tenant already owns this slug
          SELECT COUNT(*) INTO conflict_count
          FROM tenants
          WHERE tenant_slug = new_slug AND id != t.id;

          IF conflict_count = 0 THEN
            UPDATE tenants SET tenant_slug = new_slug WHERE id = t.id;
          END IF;
        END LOOP;
      END $$;
    `);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Slug regeneration is not reversible without a snapshot of previous values.
    // Leave as no-op; slugs can be corrected manually if a revert is needed.
  }
}
