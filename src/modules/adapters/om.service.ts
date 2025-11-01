import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { TransaferProcessingData, TransferAdapter } from './interface';
import { TransactionsService } from '../transactions/transactions.service';
import { Status } from 'prisma/generated/enums';
import { randomUUID } from 'crypto';

@Injectable()
export class OMService implements TransferAdapter {
  private readonly logger = new Logger(OMService.name);
  constructor(private readonly transation: TransactionsService) {}

  async process(data: TransaferProcessingData) {
    try {
      const isSuccess = Math.random() < 0.85;

      if (isSuccess) {
        await this.transation.updateStatus(data.transactionId, Status.SUCCESS);
        return {
          message: 'Transaction processed successfully',
          provider_ref: `om_${randomUUID().replace(/-/g, '').substring(0, 16)}`,
        };
      } else {
        await this.transation.updateStatus(data.transactionId, Status.FAILED);

        throw new BadRequestException('Failed to process transaction');
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
