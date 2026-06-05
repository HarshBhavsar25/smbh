import { Controller, Get, Post, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Controller('gallery')
export class GalleryController {
  constructor(
    private readonly galleryService: GalleryService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Get()
  async getAllImages() {
    return this.galleryService.findAll();
  }

  @Post()
  async addImage(@Body() body: { url: string; type?: string }) {
    return this.galleryService.create(body.url, body.type || 'IMAGE');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    const secureUrl = await this.cloudinaryService.uploadFile(file, 'gallery');
    
    // Detect type based on mime type
    const isVideo = file.mimetype.startsWith('video/');
    const type = isVideo ? 'VIDEO' : 'IMAGE';

    return this.galleryService.create(secureUrl, type);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
