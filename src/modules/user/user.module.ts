import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../global/prisma/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UserService, JwtService, PrismaService],
})
export class UserModule {}
