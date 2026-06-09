import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Get minimal students list for public staff attendance taking
  async getStudentsList() {
    return this.prisma.studentProfile.findMany({
      select: {
        id: true,
        fullName: true,
        room: {
          select: {
            roomNumber: true,
          },
        },
      },
      orderBy: [
        {
          room: {
            roomNumber: 'asc',
          },
        },
        {
          fullName: 'asc',
        },
      ],
    });
  }

  // 2. Submit attendance (creates or updates for a given date)
  async submitAttendance(dateStr: string, records: { studentId: string; status: string }[], takenBy = 'Staff') {
    const targetDate = new Date(dateStr);
    
    // Define calendar day boundary in UTC/Local to find existing session on same day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if an attendance session already exists for this calendar day
    let attendance = await this.prisma.attendance.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (attendance) {
      // Update session details
      attendance = await this.prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          takenBy,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new session
      attendance = await this.prisma.attendance.create({
        data: {
          date: targetDate,
          takenBy,
        },
      });
    }

    // Upsert records for this session
    for (const record of records) {
      await this.prisma.attendanceRecord.upsert({
        where: {
          attendanceId_studentId: {
            attendanceId: attendance.id,
            studentId: record.studentId,
          },
        },
        update: {
          status: record.status,
          updatedAt: new Date(),
        },
        create: {
          attendanceId: attendance.id,
          studentId: record.studentId,
          status: record.status,
        },
      });
    }

    return this.prisma.attendance.findUnique({
      where: { id: attendance.id },
      include: {
        records: {
          include: {
            student: {
              select: {
                fullName: true,
                room: true,
              },
            },
          },
        },
      },
    });
  }

  // 3. Query attendance history for admin dashboard
  async getAttendanceHistory(filters: {
    fromDate?: string;
    toDate?: string;
    date?: string;
    studentSearch?: string;
  }) {
    const { fromDate, toDate, date, studentSearch } = filters;
    const whereClause: any = {};

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (fromDate || toDate) {
      whereClause.date = {};
      if (fromDate) {
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        whereClause.date.gte = start;
      }
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        whereClause.date.lte = end;
      }
    } else {
      // DEFAULT: Today's date by default. Blank if not taken today.
      const today = new Date();
      const startOfToday = new Date(today);
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date(today);
      endOfToday.setHours(23, 59, 59, 999);
      whereClause.date = {
        gte: startOfToday,
        lte: endOfToday,
      };
    }

    // Query sessions matching date criteria
    const sessions = await this.prisma.attendance.findMany({
      where: whereClause,
      include: {
        records: {
          include: {
            student: {
              include: {
                room: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    // If studentSearch is provided, filter records locally or structure them appropriately
    if (studentSearch) {
      const search = studentSearch.toLowerCase();
      return sessions.map((session) => ({
        ...session,
        records: session.records.filter((rec) =>
          rec.student.fullName.toLowerCase().includes(search)
        ),
      })).filter((session) => session.records.length > 0);
    }

    return sessions;
  }
}
