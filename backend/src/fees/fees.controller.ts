import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FeesService } from './fees.service';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/payment_ss';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@UseGuards(AuthGuard('jwt'))
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const fileUrl = `http://localhost:3001/uploads/payment_ss/${file.filename}`;
    return { url: fileUrl };
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
