import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.studentProfile.findMany({
      include: {
        user: { select: { email: true, role: true } },
        room: true,
      },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id },
      include: {
        room: { include: { students: true } },
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, data: any) {
    // Separate User-level fields (email, password) from StudentProfile fields
    const { email, password, ...profileData } = data;

    // Get the student to find their userId
    const student = await this.prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    // Update User credentials if provided
    if (email || password) {
      const userUpdate: any = {};
      if (email) userUpdate.email = email;
      if (password) userUpdate.password = await bcrypt.hash(password, 10);

      await this.prisma.user.update({
        where: { id: student.userId },
        data: userUpdate,
      });
    }

    // Update StudentProfile fields if any remain
    if (Object.keys(profileData).length > 0) {
      // Parse securityDeposit and refundAmount to Float if present
      if (profileData.securityDeposit !== undefined) {
        profileData.securityDeposit = Number(profileData.securityDeposit);
      }
      if (profileData.refundAmount !== undefined) {
        profileData.refundAmount = Number(profileData.refundAmount);
      }

      // Automatically set leftDate if hasLeft changes
      if (profileData.hasLeft === true || profileData.hasLeft === 'true') {
        if (!student.hasLeft) {
          profileData.leftDate = new Date();
        }
        profileData.hasLeft = true;
      } else if (profileData.hasLeft === false || profileData.hasLeft === 'false') {
        profileData.leftDate = null;
        profileData.hasLeft = false;
      }

      return this.prisma.studentProfile.update({
        where: { id },
        data: profileData,
        include: { user: { select: { email: true, role: true } }, room: true },
      });
    }

    return this.prisma.studentProfile.findUnique({
      where: { id },
      include: { user: { select: { email: true, role: true } }, room: true },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    // Delete profile first (FK constraint), then user
    await this.prisma.studentProfile.delete({ where: { id } });
    await this.prisma.user.delete({ where: { id: student.userId } });
    return { message: 'Student deleted successfully' };
  }
}
