import { validate } from 'class-validator';
import { UpdateTenantDto } from './update-tenant.dto';

async function validateDto(dto: UpdateTenantDto) {
  return validate(dto, { whitelist: true });
}

describe('UpdateTenantDto — google_maps_embed_url validation', () => {
  it('accepts a valid Google Maps embed URL', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      google_maps_embed_url: 'https://www.google.com/maps/embed?pb=test',
    });
    const errors = await validateDto(dto);
    expect(errors.filter((e) => e.property === 'google_maps_embed_url')).toHaveLength(0);
  });

  it('accepts URL without www prefix', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      google_maps_embed_url: 'https://google.com/maps/embed?pb=test',
    });
    const errors = await validateDto(dto);
    expect(errors.filter((e) => e.property === 'google_maps_embed_url')).toHaveLength(0);
  });

  it('rejects a malicious non-Google embed URL', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      google_maps_embed_url: 'https://malicious.com/embed',
    });
    const errors = await validateDto(dto);
    const embedErrors = errors.filter((e) => e.property === 'google_maps_embed_url');
    expect(embedErrors.length).toBeGreaterThan(0);
  });

  it('rejects http (non-https) Google Maps URL', async () => {
    const dto = Object.assign(new UpdateTenantDto(), {
      google_maps_embed_url: 'http://www.google.com/maps/embed?pb=test',
    });
    const errors = await validateDto(dto);
    const embedErrors = errors.filter((e) => e.property === 'google_maps_embed_url');
    expect(embedErrors.length).toBeGreaterThan(0);
  });

  it('passes validation when google_maps_embed_url is absent (optional)', async () => {
    const dto = new UpdateTenantDto();
    const errors = await validateDto(dto);
    expect(errors.filter((e) => e.property === 'google_maps_embed_url')).toHaveLength(0);
  });
});
