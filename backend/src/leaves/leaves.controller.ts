import { Controller, Get, Post, Patch, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@UseGuards(AuthGuard('jwt'))
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const secureUrl = await this.cloudinaryService.uploadFile(file, 'leave_forms');
    return { url: secureUrl };
  }

  @Post()
  async createRequest(@Body() body: { studentId: string; imageUrl: string }) {
    return this.prisma.leaveRequest.create({
      data: {
        studentId: body.studentId,
        imageUrl: body.imageUrl,
        status: "PENDING",
      },
    });
  }

  @Get()
  async getAll() {
    return this.prisma.leaveRequest.findMany({
      include: {
        student: {
          include: { room: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('student/:studentId')
  async getByStudent(@Param('studentId') studentId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: string) {
    return this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }
}
