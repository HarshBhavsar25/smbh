import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ApplicationFormsService {
  constructor(
    private prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  async create(data: any) {
    const base64Fields = [
      'studentSignatureUrl',
      'amenityStudentSignatureUrl',
      'ackParentSignatureUrl',
      'photoUrl'
    ];

    for (const field of base64Fields) {
      if (data[field] && data[field].startsWith('data:image')) {
        try {
          const secureUrl = await this.cloudinaryService.uploadBase64(data[field], 'admission_signatures');
          data[field] = secureUrl;
        } catch (err) {
          console.error(`Error uploading base64 field ${field}:`, err);
        }
      }
    }

    return this.prisma.applicationForm.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.applicationForm.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const form = await this.prisma.applicationForm.findUnique({
      where: { id },
    });
    if (!form) {
      throw new NotFoundException('Application form not found');
    }
    return form;
  }

  async remove(id: string) {
    const form = await this.prisma.applicationForm.findUnique({
      where: { id },
    });
    if (!form) {
      throw new NotFoundException('Application form not found');
    }
    await this.prisma.applicationForm.delete({
      where: { id },
    });
    return { message: 'Application form deleted successfully' };
  }
}
