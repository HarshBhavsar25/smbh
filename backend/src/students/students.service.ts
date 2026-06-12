import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      if (profileData.balanceFee !== undefined) {
        profileData.balanceFee = Number(profileData.balanceFee);
      }
      if (profileData.laundryOpted !== undefined) {
        profileData.laundryOpted = profileData.laundryOpted === true || profileData.laundryOpted === 'true';
      }

      // Prevent reactivating/unmarking a student who has already left
      if (student.hasLeft && (profileData.hasLeft === false || profileData.hasLeft === 'false')) {
        throw new BadRequestException('A student who has left cannot be unmarked or reactivated.');
      }

      // Automatically set leftDate if hasLeft changes, and force clear room details for left students
      const isLeftOrLeaving =
        profileData.hasLeft === true ||
        profileData.hasLeft === 'true' ||
        (student.hasLeft && profileData.hasLeft !== false && profileData.hasLeft !== 'false');

      if (isLeftOrLeaving) {
        if (!student.hasLeft) {
          profileData.leftDate = new Date();
        }
        profileData.hasLeft = true;
        profileData.roomId = null;
        profileData.locationInRoom = null;
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

  async fixLeftStudents() {
    // Clear roomId and locationInRoom for all students who have already left
    const result = await this.prisma.studentProfile.updateMany({
      where: { hasLeft: true, roomId: { not: null } },
      data: { roomId: null, locationInRoom: null },
    });
    return { message: `Fixed ${result.count} left student(s) — room assignments cleared.` };
  }

  async remove(id: string) {
    const student = await this.prisma.studentProfile.findUnique({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    // Use a transaction to safely clean up all student-related data first
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete dependent complaint elements (votes and comments on any complaint)
      await tx.complaintVote.deleteMany({ where: { studentId: id } });
      await tx.complaintComment.deleteMany({ where: { studentId: id } });

      // 2. Find complaints created by the student, delete their associated comments and votes, then delete the complaints
      const studentComplaints = await tx.complaint.findMany({ where: { studentId: id } });
      const complaintIds = studentComplaints.map(c => c.id);
      if (complaintIds.length > 0) {
        await tx.complaintVote.deleteMany({ where: { complaintId: { in: complaintIds } } });
        await tx.complaintComment.deleteMany({ where: { complaintId: { in: complaintIds } } });
        await tx.complaint.deleteMany({ where: { id: { in: complaintIds } } });
      }

      // 3. Delete attendance records, vacations, leave requests, and fee payments
      await tx.attendanceRecord.deleteMany({ where: { studentId: id } });
      await tx.vacationRequest.deleteMany({ where: { studentId: id } });
      await tx.leaveRequest.deleteMany({ where: { studentId: id } });
      await tx.feePayment.deleteMany({ where: { studentId: id } });

      // 4. Delete user-related details
      await tx.notification.deleteMany({ where: { userId: student.userId } });
      await tx.activityLog.deleteMany({ where: { userId: student.userId } });
      await tx.post.deleteMany({ where: { authorId: student.userId } });

      // 5. Delete student profile
      await tx.studentProfile.delete({ where: { id } });

      // 6. Delete user
      await tx.user.delete({ where: { id: student.userId } });
    });

    return { message: 'Student deleted successfully' };
  }
}
