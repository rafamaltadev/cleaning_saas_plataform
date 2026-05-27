import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { UUID_REGEX, UUID_MSG } from '../../../common/constants/uuid.constants';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @Matches(UUID_REGEX, UUID_MSG)
  address_id?: string;

  @IsOptional()
  @IsIn(['pt-BR', 'en', 'es'])
  preferred_language?: string;
}
