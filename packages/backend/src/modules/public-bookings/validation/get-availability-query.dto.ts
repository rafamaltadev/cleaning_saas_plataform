import { IsDateString } from 'class-validator';

export class GetAvailabilityQueryDto {
  @IsDateString()
  from: string;

  @IsDateString()
  to: string;
}
