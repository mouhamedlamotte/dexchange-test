import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { TransferAdapter } from '../adapters/interface';
import { OMService } from '../adapters/om.service';
import { WaveService } from '../adapters/wave.service';
import { Status } from 'prisma/generated/enums';
import { TransactionsService } from './transactions.service';

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);
  private readonly adapters: Record<string, TransferAdapter>;
  constructor(
    private readonly wave: WaveService,
    private readonly om: OMService,
    private readonly transactionService: TransactionsService,
  ) {
    this.adapters = {
      wave: this.wave,
      om: this.om,
    };
  }

  async process(id: string) {
    try {
      const unauthorizedStatus: Status[] = [
        Status.FAILED,
        Status.CANCELED,
        Status.SUCCESS,
        Status.PROCESSING,
      ];

      console.log('id', id);

      const transaction = await this.transactionService.findOne(id);

      console.log('transaction', transaction);

      if (!transaction) {
        throw new NotFoundException(`Transaction ${id} does not exist`);
      }

      if (unauthorizedStatus.includes(transaction.status)) {
        throw new ConflictException(
          `Transaction ${id} can not be processed as it is ${transaction.status}`,
        );
      }

      await this.transactionService.updateStatus(id, Status.PROCESSING);

      const adapter = this.adapters[transaction.channel.code];
      if (!adapter) throw new NotFoundException('Provider not supported');

      await new Promise((resolve) => setTimeout(resolve, 3000));

      console.log('adapter', adapter);
      return adapter.process({
        amount: transaction.amount,
        currency: transaction.currency,
        phone: transaction.payeePhone,
        transactionId: transaction.id,
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }
}
