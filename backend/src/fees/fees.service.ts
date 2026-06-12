import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FeesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async create(data: any) {
    const status = data.status || 'PENDING';
    const payment = await this.prisma.feePayment.create({
      data: {
        studentId: data.studentId,
        amount: Number(data.amount),
        status,
        utr: data.utr || null,
        receiptUrl: data.receiptUrl || null,
        paymentType: data.paymentType || 'HOSTEL_FEE',
        hostelFee: data.hostelFee !== undefined ? Number(data.hostelFee) : 5000,
        lightBill: data.lightBill !== undefined ? Number(data.lightBill) : 300,
        laundry: data.laundry !== undefined ? Number(data.laundry) : 0,
        balanceFee: data.balanceFee !== undefined ? Number(data.balanceFee) : 0,
        sendingAccountName: data.sendingAccountName || null,
        hostelFeeMonth: data.hostelFeeMonth || null,
        lightBillMonth: data.lightBillMonth || null,
        laundryMonth: data.laundryMonth || null,
        balanceFeeMonth: data.balanceFeeMonth || null,
        paymentMode: data.paymentMode || null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      },
    });

    // If recorded status is PAID or PARTIAL, update student status
    if (status === 'PAID' || status === 'PARTIAL') {
      await this.prisma.studentProfile.update({
        where: { id: data.studentId },
        data: { feeStatus: status },
      });
    }

    return payment;
  }

  async findAll() {
    return this.prisma.feePayment.findMany({
      include: { 
        student: {
          include: { room: true }
        } 
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const fee = await this.prisma.feePayment.findUnique({
      where: { id },
      include: { 
        student: {
          include: { room: true }
        } 
      },
    });
    if (!fee) throw new NotFoundException('Fee record not found');
    return fee;
  }

  async update(id: string, data: any) {
    return this.prisma.feePayment.update({
      where: { id },
      data,
    });
  }

  async approve(id: string) {
    const payment = await this.prisma.feePayment.findUnique({
      where: { id },
      include: { student: true }
    });
    if (!payment) throw new NotFoundException('Fee record not found');

    const updatedPayment = await this.prisma.feePayment.update({
      where: { id },
      data: { status: 'PAID' },
    });

    const currentBalance = payment.student?.balanceFee || 0;
    const newBalance = Math.max(0, currentBalance - (payment.balanceFee || 0));

    await this.prisma.studentProfile.update({
      where: { id: payment.studentId },
      data: { 
        feeStatus: 'PAID',
        balanceFee: newBalance,
      },
    });

    if (payment.student && payment.student.userId) {
      await this.notificationsService.notifyUser(
        payment.student.userId,
        'Fee Payment Approved',
        `Your fee payment of ₹${payment.amount} has been approved. You can now view and download your receipt.`
      );
    }

    return updatedPayment;
  }

  async reject(id: string) {
    const payment = await this.prisma.feePayment.findUnique({
      where: { id },
    });
    if (!payment) throw new NotFoundException('Fee record not found');

    const updatedPayment = await this.prisma.feePayment.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await this.prisma.studentProfile.update({
      where: { id: payment.studentId },
      data: { feeStatus: 'PENDING' },
    });

    return updatedPayment;
  }

  async remove(id: string) {
    return this.prisma.feePayment.delete({
      where: { id },
    });
  }

  async getQrCode() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key: 'qr_code_url' },
    });
    return { url: setting?.value || null };
  }

  async updateQrCode(url: string) {
    return this.prisma.systemSetting.upsert({
      where: { key: 'qr_code_url' },
      update: { value: url },
      create: { key: 'qr_code_url', value: url },
    });
  }
}
