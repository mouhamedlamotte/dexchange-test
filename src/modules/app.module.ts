import { Module } from '@nestjs/common';
import { CommonModule } from 'src/lib/modules';

@Module({
  imports: [CommonModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
