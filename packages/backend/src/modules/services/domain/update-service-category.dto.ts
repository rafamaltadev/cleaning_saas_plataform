import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateServiceCategoryDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}
