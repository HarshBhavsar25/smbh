import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FeesCronService implements OnModuleInit {
  private readonly logger = new Logger(FeesCronService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    this.logger.log('FeesCronService initialized. Running startup check...');
    await this.checkAndResetFeesIfNeeded();
  }

  @Cron('0 0 1 * *')
  async handleMonthlyReset() {
    this.logger.log('Midnight of 1st detected. Running monthly fee reset...');
    await this.resetAllFeesToPending();
    
    // Update the last reset month file
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
    this.writeResetTracker(currentMonthKey);
  }

  private async checkAndResetFeesIfNeeded() {
    const today = new Date();
    if (today.getDate() === 1) {
      const currentMonthKey = `${today.getFullYear()}-${today.getMonth() + 1}`;
      const lastResetMonth = this.readResetTracker();

      if (lastResetMonth !== currentMonthKey) {
        this.logger.log(`Startup check: Resetting fees for new month (${currentMonthKey})...`);
        await this.resetAllFeesToPending();
        this.writeResetTracker(currentMonthKey);
      } else {
        this.logger.log('Startup check: Fee reset already applied for this month.');
      }
    } else {
      this.logger.log('Startup check: Today is not the 1st. Skipping fee reset.');
    }
  }

  private readResetTracker(): string {
    const filePath = path.join(process.cwd(), 'uploads', 'last_fee_reset.txt');
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8').trim();
      }
    } catch (e) {
      this.logger.error('Failed to read last fee reset file', e);
    }
    return '';
  }

  private writeResetTracker(value: string) {
    const dirPath = path.join(process.cwd(), 'uploads');
    const filePath = path.join(dirPath, 'last_fee_reset.txt');
    try {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      fs.writeFileSync(filePath, value, 'utf8');
    } catch (e) {
      this.logger.error('Failed to write last fee reset file', e);
    }
  }

  private async resetAllFeesToPending() {
    try {
      const result = await this.prisma.studentProfile.updateMany({
        data: {
          feeStatus: 'PENDING',
        },
      });
      this.logger.log(`Successfully reset feeStatus to PENDING for ${result.count} students.`);
    } catch (e) {
      this.logger.error('Failed to reset student fee statuses', e);
    }
  }
}
