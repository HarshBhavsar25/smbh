import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@UseGuards(AuthGuard('jwt'))
@Controller('complaints')
export class ComplaintsController {
  constructor(
    private readonly complaintsService: ComplaintsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  async create(@Request() req: any, @Body() body: any) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return this.complaintsService.create({
      title: body.title,
      description: body.description,
      studentId: student.id,
    });
  }

  @Get()
  async findAll() {
    return this.complaintsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return this.complaintsService.update(id, body);
  }

  @Post(':id/vote')
  async vote(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return this.complaintsService.vote(id, student.id, body.type);
  }

  @Post(':id/comment')
  async comment(@Param('id') id: string, @Request() req: any, @Body() body: any) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: req.user.userId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }
    return this.complaintsService.addComment(id, student.id, body.text);
  }
}
