import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
} from '@nestjs/swagger';
import { ActionsService } from './actions.service';
import { GetActionLogsDto } from './dto/get-action-logs.dto';
import { BadrequestResponse, InternalServerErrorResponse } from 'src/lib/dto';
import { ApiKeyGuard } from 'src/lib/guards/api-key.guard';

@ApiTags('Actions')
@UseGuards(ApiKeyGuard)
@ApiSecurity('api_key', ['x-api-key'])
@Controller('actions')
export class ActionsController {
  constructor(private readonly service: ActionsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer la liste des logs d’actions',
    description:
      'Retourne une liste paginée des actions effectuées (transactions, changements d’état, etc.). ' +
      'Supporte la pagination, le tri, la recherche et les filtres.',
  })
  @ApiResponse({
    status: 200,
    description: 'Liste paginée des logs d’actions',
    schema: {
      example: {
        message: 'Liste paginée des logs d’actions ',
        statusCode: HttpStatus.OK,
        data: [
          {
            type: 'TRANSACTION_CREATED',
            transaction: {
              reference: 'TXN_12345',
              amount: 12500,
              fees: 250,
              payeeName: 'John Doe',
              payeePhone: '+221770000000',
              channel: {
                code: 'wave',
                name: 'Wave',
              },
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 45,
          totalPages: 5,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    type: BadrequestResponse,
    description: 'Paramètres de requête invalides',
  })
  @ApiResponse({
    type: InternalServerErrorResponse,
    status: 500,
    description: 'Erreur interne du serveur',
  })
  async findAll(@Query() query: GetActionLogsDto) {
    const result = await this.service.findAll(query);
    return {
      message: 'Liste paginée des logs d’actions ',
      statusCode: HttpStatus.OK,
      ...result,
    };
  }
}
