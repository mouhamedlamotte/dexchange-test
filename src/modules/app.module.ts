import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from 'src/config/app.config';
import { CommonModule } from 'src/lib/modules';
import { TransactionsModule } from './transactions/transactions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      load: [appConfig],
    }),
    CommonModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
