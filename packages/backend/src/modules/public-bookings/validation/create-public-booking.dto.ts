import {
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreatePublicBookingDto {
  @Matches(UUID_REGEX, UUID_MSG)
  quote_id: string;

  @IsDateString()
  scheduled_start: string;

  @IsDateString()
  scheduled_end: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  service_address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observations?: string;
}
