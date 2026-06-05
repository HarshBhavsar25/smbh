import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.room.create({ data });
  }

  async findAll() {
    return this.prisma.room.findMany({
      include: { students: true },
    });
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { students: true },
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async update(id: string, data: any) {
    return this.prisma.room.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.room.delete({
      where: { id },
    });
  }
}
