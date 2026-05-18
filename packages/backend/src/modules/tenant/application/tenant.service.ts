import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TenantRepository } from '../infrastructure/tenant.repository';
import { TenantResponseDto } from '../domain/tenant-response.dto';
import { UpdateTenantDto } from '../domain/update-tenant.dto';
import { StorageAdapter, STORAGE_ADAPTER } from '../../../common/storage/storage.adapter';
import * as path from 'path';

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const ALLOWED_MIMES = ['image/png', 'image/jpeg'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    @Inject(STORAGE_ADAPTER) private readonly storageAdapter: StorageAdapter,
  ) {}

  async getById(tenantId: string): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }
    return TenantResponseDto.from(tenant);
  }

  async update(tenantId: string, dto: UpdateTenantDto): Promise<TenantResponseDto> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({
        code: 'TENANT_NOT_FOUND',
        message: 'Tenant not found',
      });
    }

    if (dto.tenant_slug !== undefined && dto.tenant_slug !== tenant.tenant_slug) {
      const existing = await this.tenantRepository.findBySlug(dto.tenant_slug);
      if (existing && existing.id !== tenantId) {
        throw new ConflictException({
          code: 'SLUG_CONFLICT',
          message: 'tenant_slug is already taken',
        });
      }
    }

    if (dto.name !== undefined) tenant.name = dto.name;
    if (dto.currency !== undefined) tenant.currency = dto.currency;
    if (dto.timezone !== undefined) tenant.timezone = dto.timezone;
    if (dto.tenant_slug !== undefined) tenant.tenant_slug = dto.tenant_slug;
    if (dto.logo_url !== undefined) tenant.logo_url = dto.logo_url;
    if (dto.primary_color !== undefined) tenant.primary_color = dto.primary_color;
    if (dto.favicon_url !== undefined) tenant.favicon_url = dto.favicon_url;

    const saved = await this.tenantRepository.save(tenant);
    return TenantResponseDto.from(saved);
  }

  async uploadLogo(tenantId: string, file: UploadedFile): Promise<{ logo_url: string }> {
    this.validateImageFile(file);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${tenantId}-logo-${Date.now()}${ext}`;
    const url = await this.storageAdapter.save(file.buffer, filename, file.mimetype);
    tenant.logo_url = url;
    await this.tenantRepository.save(tenant);
    return { logo_url: url };
  }

  async uploadFavicon(tenantId: string, file: UploadedFile): Promise<{ favicon_url: string }> {
    this.validateImageFile(file);
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new NotFoundException({ code: 'TENANT_NOT_FOUND', message: 'Tenant not found' });
    }
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${tenantId}-favicon-${Date.now()}${ext}`;
    const url = await this.storageAdapter.save(file.buffer, filename, file.mimetype);
    tenant.favicon_url = url;
    await this.tenantRepository.save(tenant);
    return { favicon_url: url };
  }

  private validateImageFile(file: UploadedFile): void {
    if (!ALLOWED_MIMES.includes(file.mimetype)) {
      throw new ConflictException({
        code: 'INVALID_MIME_TYPE',
        message: 'Only image/png and image/jpeg files are allowed',
      });
    }
    if (file.size > MAX_FILE_SIZE) {
      throw new ConflictException({
        code: 'FILE_TOO_LARGE',
        message: 'File must be 2MB or smaller',
      });
    }
  }
}
