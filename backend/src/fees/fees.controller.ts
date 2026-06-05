import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeesService } from './fees.service';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@UseGuards(AuthGuard('jwt'))
@Controller('fees')
export class FeesController {
  constructor(
    private readonly feesService: FeesService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const secureUrl = await this.cloudinaryService.uploadFile(file, 'payment_ss');
    return { url: secureUrl };
  }

  @Post()
  create(@Body() createFeeDto: any) {
    return this.feesService.create(createFeeDto);
  }

  @Get()
  findAll() {
    return this.feesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.feesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFeeDto: any) {
    return this.feesService.update(id, updateFeeDto);
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string) {
    return this.feesService.approve(id);
  }

  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.feesService.reject(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.feesService.remove(id);
  }
}
