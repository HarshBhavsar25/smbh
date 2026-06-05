import { Module } from '@nestjs/common';
import { VacationsService } from './vacations.service';
import { VacationsController } from './vacations.controller';

@Module({
  providers: [VacationsService],
  controllers: [VacationsController]
})
export class VacationsModule {}
