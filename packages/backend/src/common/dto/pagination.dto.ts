import { IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]*$/)
  sort?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC', 'asc', 'desc'])
  order: 'ASC' | 'DESC' | 'asc' | 'desc' = 'ASC';
}
