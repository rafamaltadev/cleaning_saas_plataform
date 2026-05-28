import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentConfigDto {
  @ApiProperty({ description: 'Payment mode', enum: ['manual', 'automatic'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['manual', 'automatic'])
  payment_mode: string;

  @ApiProperty({ description: 'Payment timing', enum: ['prepaid', 'postpaid'] })
  @IsNotEmpty()
  @IsString()
  @IsIn(['prepaid', 'postpaid'])
  payment_timing: string;
}
