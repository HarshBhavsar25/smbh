import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class VacationsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(data: any) {
    const vacation = await this.prisma.vacationRequest.create({
      data,
      include: { student: true },
    });

    // Notify all admins about the new vacation request
    const studentName = vacation.student?.fullName || 'A student';
    const departure = new Date(vacation.departureDate).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
    const returnInfo = vacation.returnDate
      ? `Returns: ${new Date(vacation.returnDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`
      : 'Return date not specified';

    await this.notificationsService.notifyAllAdmins(
      '🏠 Vacation Request',
      `${studentName} has submitted a vacation request. Departure: ${departure}. ${returnInfo}.`,
    );

    return vacation;
  }

  async findAll() {
    return this.prisma.vacationRequest.findMany({
      include: {
        student: {
          include: { room: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForStudent(studentId: string) {
    return this.prisma.vacationRequest.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.vacationRequest.update({
      where: { id },
      data,
    });
  }

  async clearAll() {
    const { count } = await this.prisma.vacationRequest.deleteMany();
    return { message: `Deleted ${count} vacation record(s) successfully.` };
  }
}
