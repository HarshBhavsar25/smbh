import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
        room: {
          include: { students: true }
        } 
      },
    });
    if (!student) throw new NotFoundException('Student not found');
    return student;
  }

  async update(id: string, data: any) {
    return this.prisma.studentProfile.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.studentProfile.delete({
      where: { id },
    });
  }
}
