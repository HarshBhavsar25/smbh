import { Controller, Post, Patch, Body, UseGuards, UseInterceptors, UploadedFile, Request, Param, Get } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService
  ) {}

  @Get('me')
  async getMe(@Request() req: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { studentProfile: true }
    });
    return user;
  }

  @Post('upload-profile')
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfileImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const secureUrl = await this.cloudinaryService.uploadFile(file, 'profiles');
    return { url: secureUrl };
  }

  @Patch('me/profile-image')
  async updateProfileImage(@Request() req: any, @Body() body: { imageUrl: string }) {
    return this.prisma.user.update({
      where: { id: req.user.userId },
      data: { profileImage: body.imageUrl },
    });
  }

  @Patch('me/fcm-token')
  async updateFcmToken(@Request() req: any, @Body() body: { fcmToken: string }) {
    return this.prisma.user.update({
      where: { id: req.user.userId },
      data: { fcmToken: body.fcmToken },
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
