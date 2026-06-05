import { Controller, Get, Post, Delete, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { diskStorage } from 'multer';
import { extname } from 'path';

const storage = diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
  },
});

@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  async getAllImages() {
    return this.galleryService.findAll();
  }

  @Post()
  async addImage(@Body() body: { url: string; type?: string }) {
    return this.galleryService.create(body.url, body.type || 'IMAGE');
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    
    const fileUrl = `http://localhost:3001/uploads/${file.filename}`;
    
    // Detect type based on mime type or file extension
    const isVideo = file.mimetype.startsWith('video/') || 
                    ['.mp4', '.mov', '.avi', '.mkv', '.webm'].includes(extname(file.originalname).toLowerCase());
    const type = isVideo ? 'VIDEO' : 'IMAGE';

    return this.galleryService.create(fileUrl, type);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
