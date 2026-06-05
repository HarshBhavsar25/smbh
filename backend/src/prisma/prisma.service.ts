import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Note: We skip actual connection in local env if database isn't ready
    try {
      await this.$connect();
    } catch (error) {
      console.log("Database connection delayed or unavailable.");
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
