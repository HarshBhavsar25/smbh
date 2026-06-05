import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'))
@Controller('rules')
export class RulesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getRules() {
    return this.prisma.rule.findMany({
      orderBy: { createdAt: 'asc' },
    });
  }

  @Post()
  async addRule(@Body() body: { title: string; content: string }) {
    return this.prisma.rule.create({
      data: {
        title: body.title,
        content: body.content,
      },
    });
  }

  @Delete(':id')
  async deleteRule(@Param('id') id: string) {
    return this.prisma.rule.delete({
      where: { id },
    });
  }
}
