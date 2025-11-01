import { Injectable, Logger } from '@nestjs/common';
import {
  FilterConfig,
  FilterService,
  PaginationService,
  PrismaService,
} from 'src/lib/services';
import { AddActionLogDto } from './dto/add-action-log.dto';
import { GetActionLogsDto } from './dto/get-action-logs.dto';

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);
  constructor(
    private prisma: PrismaService,
    private readonly pagination: PaginationService,
    private readonly filter: FilterService,
  ) {}

  private getActionLogFilterConfig(): FilterConfig {
    return {
      allowedFilters: ['type', 'transactionId'],
      searchConfig: {
        searchKey: 'q',
        searchFields: ['transactionId'],
      },
    };
  }

  async findAll(query: GetActionLogsDto) {
    try {
      const filterConfig = this.getActionLogFilterConfig();
      const where = this.filter.buildDynamicFilters(query, filterConfig);
      const orderBy = this.pagination.buildOrderBy(
        query.sortBy,
        query.sortOrder,
      );

      const result = await this.pagination.paginate(this.prisma.action, {
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

  async add(data: AddActionLogDto) {
    try {
      const actionLog = await this.prisma.action.create({
        data,
        select: {
          type: true,
          transaction: {
            select: {
              reference: true,
              amount: true,
              fees: true,
              payeeName: true,
              payeePhone: true,
              channel: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `[ACTION] : ${actionLog.type}`,
        JSON.stringify(actionLog, null, 2),
      );
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
