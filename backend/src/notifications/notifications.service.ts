import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private integrationsService: IntegrationsService,
  ) {}

  async getNotificationsForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // Notify a single user (DB + FCM)
  async notifyUser(userId: string, title: string, body: string) {
    try {
      // 1. Create database notification record
      await this.prisma.notification.create({
        data: {
          userId,
          title,
          message: body,
        },
      });

      // 2. Fetch FCM token and send push notification
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { fcmToken: true },
      });

      if (user?.fcmToken) {
        await this.integrationsService.sendPushNotification(user.fcmToken, title, body);
      }
    } catch (err) {
      this.logger.error(`Failed to send notification to user ${userId}: ${err.message}`);
    }
  }

  // Notify all students (DB + FCM)
  async notifyAllStudents(title: string, body: string) {
    try {
      const students = await this.prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, fcmToken: true },
      });

      if (students.length === 0) return;

      // Create DB notifications for all
      await this.prisma.notification.createMany({
        data: students.map((s) => ({
          userId: s.id,
          title,
          message: body,
        })),
      });

      // Send FCM push notifications
      const tokens = students.map((s) => s.fcmToken).filter((t): t is string => !!t);
      if (tokens.length > 0) {
        await this.integrationsService.sendMulticastNotification(tokens, title, body);
      }
    } catch (err) {
      this.logger.error(`Failed to notify all students: ${err.message}`);
    }
  }

  // Notify all admins (DB + FCM)
  async notifyAllAdmins(title: string, body: string) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, fcmToken: true },
      });

      if (admins.length === 0) return;

      // Create DB notifications for all
      await this.prisma.notification.createMany({
        data: admins.map((a) => ({
          userId: a.id,
          title,
          message: body,
        })),
      });

      // Send FCM push notifications
      const tokens = admins.map((a) => a.fcmToken).filter((t): t is string => !!t);
      if (tokens.length > 0) {
        await this.integrationsService.sendMulticastNotification(tokens, title, body);
      }
    } catch (err) {
      this.logger.error(`Failed to notify all admins: ${err.message}`);
    }
  }
}
