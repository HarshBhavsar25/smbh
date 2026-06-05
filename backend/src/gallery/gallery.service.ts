import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GalleryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.galleryMedia.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(url: string, type: string = 'IMAGE') {
    let album = await this.prisma.galleryAlbum.findFirst();
    if (!album) {
      album = await this.prisma.galleryAlbum.create({
        data: { title: 'Main Gallery' }
      });
    }
    return this.prisma.galleryMedia.create({
      data: { url, type, albumId: album.id },
    });
  }

  async remove(id: string) {
    return this.prisma.galleryMedia.delete({
      where: { id },
    });
  }
}
