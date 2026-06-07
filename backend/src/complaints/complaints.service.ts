import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ComplaintsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any) {
    const complaint = await this.prisma.complaint.create({ 
      data,
      include: { student: true }
    });

    // Notify all admins about the new complaint
    await this.notificationsService.notifyAllAdmins(
      `New Complaint: ${complaint.title}`,
      `Submitted by ${complaint.student?.fullName || 'a student'}`
    );

    return complaint;
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
    const complaint = await this.prisma.complaint.update({
      where: { id },
      data,
      include: { student: true }
    });

    // Notify the student about the status update
    if (data.status && complaint.student?.userId) {
      await this.notificationsService.notifyUser(
        complaint.student.userId,
        `Complaint Status Updated: ${complaint.title}`,
        `The status of your complaint has been changed to ${data.status}`
      );
    }

    return complaint;
  }

  async findForStudent(studentId: string) {
    return this.prisma.complaint.findMany({
      where: { studentId },
      include: {
        student: true,
        comments: { include: { student: true } },
        votes: true
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: string) {
    await this.prisma.complaintComment.deleteMany({ where: { complaintId: id } });
    await this.prisma.complaintVote.deleteMany({ where: { complaintId: id } });
    return this.prisma.complaint.delete({ where: { id } });
  }

  async addComment(complaintId: string, studentId: string, text: string) {
    const comment = await this.prisma.complaintComment.create({
      data: { complaintId, studentId, text },
      include: { 
        student: true,
        complaint: { include: { student: true } }
      }
    });

    const complaint = comment.complaint;
    const commenterName = comment.student?.fullName || 'A resident';

    if (complaint) {
      // 1. Notify the complaint owner (student) if the commenter is someone else
      if (complaint.studentId !== studentId && complaint.student?.userId) {
        await this.notificationsService.notifyUser(
          complaint.student.userId,
          `New Comment on: ${complaint.title}`,
          `${commenterName}: "${text}"`
        );
      }
      
      // 2. Notify all admins about the new comment
      await this.notificationsService.notifyAllAdmins(
        `Comment on Complaint: ${complaint.title}`,
        `${commenterName}: "${text}"`
      );
    }

    return comment;
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
