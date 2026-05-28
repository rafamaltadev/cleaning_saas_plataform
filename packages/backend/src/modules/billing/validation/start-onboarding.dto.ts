import { IsNotEmpty, IsString, Length, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class StartOnboardingDto {
  @ApiProperty({ description: 'Country code (2 chars)', example: 'BR' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  country: string;

  @ApiProperty({ description: 'Business email for Stripe Connect account' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
