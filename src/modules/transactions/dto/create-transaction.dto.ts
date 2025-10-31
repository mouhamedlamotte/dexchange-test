import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  Min,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPhoneNumberForCountries } from 'src/lib/validations';

class RecipientDto {
  @ApiProperty({
    example: '+221770000000',
    description: 'The phone number of the recipient',
  })
  @IsPhoneNumberForCountries(['SN'])
  phone: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the recipient',
  })
  @IsString()
  name: string;
}

export class CreateTransactionDto {
  @ApiProperty({
    example: 12500,
    description: 'The amount of the transaction',
  })
  @IsNumber()
  @Min(100)
  amount: number;

  @ApiProperty({
    example: 'wave',
    description: 'The channel of the transaction',
  })
  @IsString()
  channel: string;

  @ApiProperty({
    description: 'Recipient information (name, phone)',
    type: () => RecipientDto,
  })
  @ValidateNested()
  @Type(() => RecipientDto)
  recipient: RecipientDto;

  @ApiProperty({
    required: false,
    description: 'Optional metadata as a JSON object or string',
    example: { note: 'Payment for order #1234' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
