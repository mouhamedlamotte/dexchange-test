import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiSecurity,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsDto } from './dto/get-transactions.dto';
import { TransferService } from './transfer.service';
import { ApiKeyGuard } from 'src/lib/guards/api-key.guard';

@ApiTags('Transactions')
@Controller('transactions')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api_key', ['x-api-key'])
export class TransactionsController {
  constructor(
    private readonly service: TransactionsService,
    private readonly transfer: TransferService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une transaction',
    description:
      'Crée une nouvelle transaction à partir des informations du destinataire et du canal.',
  })
  @ApiBody({ type: CreateTransactionDto })
  @ApiResponse({
    status: 201,
    description: 'Transaction créée avec succès',
    schema: {
      example: {
        statusCode: 201,
        message: 'Transaction created successfully',
        data: {
          id: 'b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77',
          reference: 'DEXC_TX_2A4C9C9E6A7C4FBA',
          amount: 12600,
          fees: 100,
          payeeName: 'John Doe',
          payeePhone: '+221770000000',
          status: 'PENDING',
          channelId: 'wave',
        },
      },
    },
  })
  async create(@Body() data: CreateTransactionDto) {
    const transaction = await this.service.create(data);
    return {
      statusCode: 201,
      message: 'Transaction created successfully',
      data: transaction,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lister les transactions',
    description:
      'Retourne une liste paginée et filtrable des transactions existantes. ' +
      'Supporte la recherche, les filtres et le tri dynamique.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des transactions',
    schema: {
      example: {
        statusCode: 200,
        message: 'Transactions fetched successfully',
        data: [
          {
            id: '1a2b3c4d',
            reference: 'DEXC_TX_123ABC',
            amount: 12500,
            fees: 100,
            status: 'PENDING',
            payeeName: 'John Doe',
            payeePhone: '+221770000000',
            channel: { code: 'wave', name: 'Wave' },
          },
        ],
        pagination: { page: 1, limit: 10, total: 42, totalPages: 5 },
      },
    },
  })
  async findAll(@Query() query: GetTransactionsDto) {
    const result = await this.service.findAll(query);
    return {
      statusCode: 200,
      message: 'Transactions fetched successfully',
      ...result,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer une transaction',
    description:
      'Retourne les détails d’une transaction spécifique par son ID.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant unique de la transaction',
    example: 'b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction trouvée',
    schema: {
      example: {
        statusCode: 200,
        message: 'Transaction fetched successfully',
        data: {
          id: 'b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77',
          reference: 'DEXC_TX_123ABC',
          amount: 12600,
          fees: 100,
          status: 'SUCCESS',
          payeeName: 'John Doe',
          payeePhone: '+221770000000',
          channel: { code: 'wave', name: 'Wave' },
        },
      },
    },
  })
  async findOne(@Param('id') id: string) {
    const transaction = await this.service.findOne(id);
    return {
      statusCode: 200,
      message: 'Transaction fetched successfully',
      data: transaction,
    };
  }

  @Post(':id/process')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Traiter une transaction',
    description:
      'Simule le traitement de la transaction (succès ou échec aléatoire).',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant unique de la transaction à traiter',
  })
  @ApiResponse({
    status: 202,
    description: 'Transaction en cours de traitement',
    schema: {
      example: {
        statusCode: 202,
        message: 'Transaction processing started',
        data: { transactionId: 'b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77' },
      },
    },
  })
  async process(@Param('id') id: string) {
    const data = await this.transfer.process(id);
    return {
      statusCode: 202,
      message: 'Transaction processing started',
      data,
    };
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Annuler une transaction',
    description:
      'Annule une transaction uniquement si son statut est encore `PENDING`.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identifiant unique de la transaction à annuler',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction annulée avec succès',
    schema: {
      example: {
        statusCode: 200,
        message: 'Transaction canceled successfully',
        data: {
          id: 'b9eec2d8-2d38-4a87-bbe1-9e2a5b77cd77',
          status: 'CANCELED',
        },
      },
    },
  })
  async cancel(@Param('id') id: string) {
    const transaction = await this.service.cancel(id);
    return {
      statusCode: 200,
      message: 'Transaction canceled successfully',
      data: transaction,
    };
  }
}
