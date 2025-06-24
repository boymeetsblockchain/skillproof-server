import { Injectable } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { CreateUserDto } from './dtos/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  //   todo user connect

  async createNewUser(input: CreateUserDto) {
    await this.prisma.user.create({
      data: {
        walletAddress: input.walletAddress,
      },
    });
  }
}
