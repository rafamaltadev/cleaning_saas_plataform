import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptTermsDto {
  @ApiProperty({ description: 'Version of the terms being accepted' })
  @IsNotEmpty()
  @IsString()
  terms_version: string;
}
