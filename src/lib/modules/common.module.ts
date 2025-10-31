import { Global, Module } from '@nestjs/common';
import { FilterService, PaginationService, PrismaService } from '../services';
import { HealthController } from '../controllers/health.controller';

@Global()
@Module({
  providers: [PrismaService, PaginationService, FilterService],
  exports: [PrismaService, PaginationService, FilterService],
  controllers: [HealthController],
})
export class CommonModule {}
