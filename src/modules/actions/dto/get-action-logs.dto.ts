import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ActionType } from 'prisma/generated/enums';
import { PaginationDto } from 'src/lib/dto';

export class GetActionLogsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: '5a7b6b0a-4b1a-4b1a-4b1a-4b1a4b1a4b1a',
    description: 'Id of the transaction',
  })
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({
    example: ActionType.TRANSFER_SUCCESS,
    description: 'Id of the transaction',
  })
  @IsString()
  type?: string;
}
