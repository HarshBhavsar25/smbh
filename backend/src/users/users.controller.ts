import { Controller, Post, Patch, Body, UseGuards, UseInterceptors, UploadedFile, Request, Param, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';

const storage = diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads/profiles';
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
@Controller('users')
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { studentProfile: true }
    });
    return user;
  }

  @Post('upload-profile')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async uploadProfileImage(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const fileUrl = `http://localhost:3001/uploads/profiles/${file.filename}`;
    return { url: fileUrl };
  }

  @Patch('me/profile-image')
  async updateProfileImage(@Request() req: any, @Body() body: { imageUrl: string }) {
    return this.prisma.user.update({
      where: { id: req.user.userId },
      data: { profileImage: body.imageUrl },
    });
  }

  @Patch('students/:id/profile-image')
  async updateStudentProfileImage(@Param('id') id: string, @Body() body: { imageUrl: string }) {
    return this.prisma.studentProfile.update({
      where: { id },
      data: { photo: body.imageUrl },
    });
  }
}
