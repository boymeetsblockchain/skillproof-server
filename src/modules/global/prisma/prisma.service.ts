import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();

    console.log('::> Prisma connected to postgres db');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('::> Prisma disconnected from postgres db');
  }
}
