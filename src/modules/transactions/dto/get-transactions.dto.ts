import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Status } from 'prisma/generated/enums';
import { PaginationDto } from 'src/lib/dto';

export class GetTransactionsDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: Status,
    example: Status.PENDING,
    description: 'Status of the transaction',
  })
  @IsOptional()
  @IsEnum(Status)
  status?: Status;

  @ApiPropertyOptional({
    example: 'wave',
    description: 'Channel of the transaction',
  })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({
    example: 1000,
    description: 'Minimum amount of the transaction',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Maximum amount of the transaction',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;
}
