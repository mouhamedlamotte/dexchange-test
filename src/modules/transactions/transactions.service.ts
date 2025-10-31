import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  FilterConfig,
  FilterService,
  PaginationService,
  PrismaService,
} from 'src/lib/services';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ActionsService } from '../actions/actions.service';
import { GetTransactionsDto } from './dto/get-transactions.dto';

// Frais :
// fees = 0.8% arrondi au supérieur
// min = 100
// max = 1500
// total = amount + fees

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly actions: ActionsService,
    private readonly pagination: PaginationService,
    private readonly filter: FilterService,
  ) {}
  private generateReference(): string {
    return `DEXC_TX_${randomUUID().replace(/-/g, '').substring(0, 16).toUpperCase()}`;
  }

  private getTransactionsFilterConfig(): FilterConfig {
    return {
      allowedFilters: ['channel', 'status'],
      relationFilters: [
        {
          relation: 'channel',
          field: 'code',
          filterKey: 'channel',
          operator: 'equals',
        },
      ],
      numericFilters: [
        {
          field: 'amount',
          minKey: 'minAmount',
          maxKey: 'maxAmount',
        },
      ],
      searchConfig: {
        searchKey: 'q',
        searchFields: ['reference', 'payeeName', 'payeePhone'],
        relationSearchFields: [
          {
            relation: 'channel',
            fields: ['name', 'code'],
          },
        ],
      },
    };
  }

  async create(data: CreateTransactionDto) {
    try {
      const channel = this.prisma.channel.findUnique({
        where: {
          code: data.channel,
        },
      });

      if (!channel) {
        throw new ForbiddenException(`Channer ${data.channel} does not exist`);
      }

      const fees = Math.min(
        Math.max(Math.ceil(data.amount * 0.008), 100),
        1500,
      );
      const total = data.amount + fees;

      const transaction = await this.prisma.transaction.create({
        data: {
          reference: this.generateReference(),
          amount: total,
          fees,
          channel: {
            connect: {
              code: data.channel,
            },
          },
          payeeName: data.recipient.name,
          payeePhone: data.recipient.phone,
        },
      });

      await this.actions.add({
        type: 'TRANSFER_CREATED',
        transactionId: transaction.id,
      });

      return transaction;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findAll(query: GetTransactionsDto) {
    try {
      const filterConfig = this.getTransactionsFilterConfig();
      const where = this.filter.buildDynamicFilters(query, filterConfig);
      const orderBy = this.pagination.buildOrderBy(
        query.sortBy,
        query.sortOrder,
      );

      const result = this.pagination.paginate(this.prisma.transaction, {
        page: query.page,
        limit: query.limit,
        where,
        orderBy,
      });

      return result;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: {
          id,
        },
      });

      if (!transaction) {
        throw new NotFoundException(`Transaction ${id} does not exist`);
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
