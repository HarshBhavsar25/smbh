import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
  async findAll(@Request() req: any) {
    if (req.user.role === 'STUDENT') {
      const student = await this.prisma.studentProfile.findUnique({
        where: { userId: req.user.userId },
      });
      if (!student) return [];
      return this.complaintsService.findForStudent(student.id);
    }
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

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { studentProfile: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const complaint = await this.complaintsService.findOne(id);
    if (!complaint) throw new NotFoundException('Complaint not found');

    if (user.role !== 'ADMIN') {
      if (!user.studentProfile || complaint.studentId !== user.studentProfile.id) {
        throw new UnauthorizedException('You can only delete your own complaints');
      }
    }

    return this.complaintsService.remove(id);
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
