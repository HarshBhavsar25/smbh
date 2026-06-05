import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.post.create({ data });
  }

  async findAll() {
    return this.prisma.post.findMany({
      include: { author: { select: { email: true, role: true } } },
    });
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async remove(id: string) {
    return this.prisma.post.delete({
      where: { id },
    });
  }
}
