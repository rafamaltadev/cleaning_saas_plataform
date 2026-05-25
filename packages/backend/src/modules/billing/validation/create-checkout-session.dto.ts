import { IsString, IsUrl, Matches } from 'class-validator';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_MSG = { message: '$property must be a valid UUID' };

export class CreateCheckoutSessionDto {
  @Matches(UUID_REGEX, UUID_MSG)
  plan_id: string;

  @IsString()
  @IsUrl({ require_tld: false })
  success_url: string;

  @IsString()
  @IsUrl({ require_tld: false })
  cancel_url: string;
}
