import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VacationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.vacationRequest.create({ data });
  }

  async findAll() {
    return this.prisma.vacationRequest.findMany({
      include: { student: true },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.vacationRequest.update({
      where: { id },
      data,
    });
  }
}
