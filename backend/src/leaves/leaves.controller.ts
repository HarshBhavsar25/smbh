import { Controller, Get, Post, Patch, Param, Body, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/leave_forms';
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
@Controller('leave-requests')
export class LeaveRequestsController {
  constructor(private prisma: PrismaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const fileUrl = `http://localhost:3001/uploads/leave_forms/${file.filename}`;
    return { url: fileUrl };
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
