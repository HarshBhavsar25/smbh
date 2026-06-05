import { Module } from '@nestjs/common';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { FeesCronService } from './fees-cron.service';

@Module({
  providers: [FeesService, FeesCronService],
  controllers: [FeesController]
})
export class FeesModule {}
