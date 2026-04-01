import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('🗄️  Database connected successfully');
    } catch (error) {
      console.warn('⚠️  Database connection failed - running in development mode without DB');
      console.warn('Error:', error.message);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (error) {
      console.warn('Warning during database disconnect:', error.message);
    }
  }
}
