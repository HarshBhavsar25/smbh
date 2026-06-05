import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly uploadDir = path.join(process.cwd(), 'uploads');
  private transporter: nodemailer.Transporter;

  constructor(private readonly cloudinaryService: CloudinaryService) {
    // 1. Ensure the uploads directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // 2. Initialize Firebase Admin
    try {
      const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(serviceAccountPath)) {
        const serviceAccount = require(serviceAccountPath);
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
          });
          this.logger.log('Firebase Admin SDK initialized successfully.');
        }
      } else {
        this.logger.warn('firebase-service-account.json not found, skipping FCM init.');
      }
    } catch (error) {
      this.logger.error(`Could not initialize Firebase Admin SDK: ${error.message}`);
    }

    // 3. Initialize Nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Cloudinary File Storage (Images & Videos)
  async uploadFile(file: Express.Multer.File): Promise<string> {
    this.logger.log(`Uploading file to Cloudinary: ${file.originalname}`);
    return this.cloudinaryService.uploadFile(file, 'integrations');
  }

  // Nodemailer Implementation
  async sendEmail(to: string, subject: string, body: string) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        this.logger.warn('SMTP credentials not configured. Skipping email.');
        return { success: false, message: 'SMTP not configured' };
      }

      const info = await this.transporter.sendMail({
        from: `"Shree Mauli Hostel" <${process.env.SMTP_USER}>`,
        to: to,
        subject: subject,
        text: body,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // FCM Implementation
  async sendPushNotification(token: string, title: string, body: string) {
    try {
      if (!admin.apps.length) {
        this.logger.warn('Firebase not initialized, skipping push notification.');
        return { success: false };
      }
      
      const message = {
        notification: { title, body },
        token: token,
      };
      
      const response = await admin.messaging().send(message);
      this.logger.log(`Successfully sent FCM message to ${token.substring(0, 10)}...`);
      return { success: true, response };
    } catch (error) {
      this.logger.error(`Error sending FCM message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async sendMulticastNotification(tokens: string[], title: string, body: string) {
    try {
      if (!admin.apps.length) {
        this.logger.warn('Firebase not initialized, skipping multicast notification.');
        return { success: false };
      }
      if (!tokens || tokens.length === 0) {
        return { success: true };
      }
      
      const message = {
        notification: { title, body },
        tokens: tokens,
      };
      
      const response = await admin.messaging().sendEachForMulticast(message);
      this.logger.log(`Successfully sent multicast FCM: ${response.successCount} successes, ${response.failureCount} failures`);
      return { success: true, response };
    } catch (error) {
      this.logger.error(`Error sending multicast FCM message: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // WhatsApp Link Generation
  generateWhatsAppLink(phone: string, message: string): string {
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${phone}?text=${encodedMessage}`;
  }
}
