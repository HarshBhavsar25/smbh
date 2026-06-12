import { Module } from '@nestjs/common';
import { ApplicationFormsController } from './application-forms.controller';
import { ApplicationFormsService } from './application-forms.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [ApplicationFormsController],
  providers: [ApplicationFormsService],
  exports: [ApplicationFormsService],
})
export class ApplicationFormsModule {}
