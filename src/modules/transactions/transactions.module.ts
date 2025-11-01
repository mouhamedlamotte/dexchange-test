import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { ActionsService } from '../actions/actions.service';
import { TransferService } from './transfer.service';
import { OMService } from '../adapters/om.service';
import { WaveService } from '../adapters/wave.service';

@Module({
  providers: [
    TransactionsService,
    ActionsService,
    TransferService,
    OMService,
    WaveService,
  ],
  controllers: [TransactionsController],
})
export class TransactionsModule {}
