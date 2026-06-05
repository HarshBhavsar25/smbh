import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.complaint.create({ data });
  }

  async findAll() {
    return this.prisma.complaint.findMany({
      include: { 
        student: true, 
        comments: { include: { student: true } }, 
        votes: true 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { 
        student: true, 
        comments: { include: { student: true } }, 
        votes: true 
      },
    });
    if (!complaint) throw new NotFoundException('Complaint not found');
    return complaint;
  }

  async update(id: string, data: any) {
    return this.prisma.complaint.update({
      where: { id },
      data,
    });
  }

  async addComment(complaintId: string, studentId: string, text: string) {
    return this.prisma.complaintComment.create({
      data: { complaintId, studentId, text },
    });
  }

  async vote(complaintId: string, studentId: string, type: boolean) {
    const existingVote = await this.prisma.complaintVote.findUnique({
      where: {
        complaintId_studentId: { complaintId, studentId }
      }
    });

    if (existingVote) {
      if (existingVote.type === type) {
        // Toggle off the vote
        return this.prisma.complaintVote.delete({
          where: { id: existingVote.id }
        });
      } else {
        // Update the vote type
        return this.prisma.complaintVote.update({
          where: { id: existingVote.id },
          data: { type }
        });
      }
    } else {
      // Create a new vote
      return this.prisma.complaintVote.create({
        data: { complaintId, studentId, type }
      });
    }
  }
}
