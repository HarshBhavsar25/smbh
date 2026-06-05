import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any) {
    const post = await this.prisma.post.create({ data });
    
    // Trigger notification to all students
    const prefix = post.type === 'URGENT' ? '🚨 URGENT: ' : '📢 NOTICE: ';
    await this.notificationsService.notifyAllStudents(
      `${prefix}${post.title}`,
      post.content
    );

    return post;
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
