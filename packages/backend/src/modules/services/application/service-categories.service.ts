import { Injectable, NotFoundException } from '@nestjs/common';
import { ServiceCategoryRepository } from '../infrastructure/service-category.repository';
import { ServiceCategoryResponseDto } from '../domain/service-category-response.dto';
import { CreateServiceCategoryDto } from '../domain/create-service-category.dto';
import { UpdateServiceCategoryDto } from '../domain/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private readonly categoryRepository: ServiceCategoryRepository) {}

  async findAll(tenantId: string): Promise<ServiceCategoryResponseDto[]> {
    const categories = await this.categoryRepository.findAll(tenantId);
    return categories.map(ServiceCategoryResponseDto.from);
  }

  async create(tenantId: string, dto: CreateServiceCategoryDto): Promise<ServiceCategoryResponseDto> {
    const category = await this.categoryRepository.save({
      tenant_id: tenantId,
      name: dto.name,
      deleted_at: null,
    });
    return ServiceCategoryResponseDto.from(category);
  }

  async update(
    tenantId: string,
    categoryId: string,
    dto: UpdateServiceCategoryDto,
  ): Promise<ServiceCategoryResponseDto> {
    const existing = await this.categoryRepository.findById(categoryId, tenantId);
    if (!existing) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }
    Object.assign(existing, dto);
    const saved = await this.categoryRepository.save(existing);
    return ServiceCategoryResponseDto.from(saved);
  }

  async remove(tenantId: string, categoryId: string): Promise<void> {
    const existing = await this.categoryRepository.findById(categoryId, tenantId);
    if (!existing) {
      throw new NotFoundException({ code: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }
    await this.categoryRepository.softDelete(categoryId);
  }
}
