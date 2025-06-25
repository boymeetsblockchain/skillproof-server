import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { CreateNewVerification } from './dtos/verification.dto';

@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}
  async createVerification(userId: string, input: CreateNewVerification) {
    const userExists = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    if (!userExists) {
      throw new NotFoundException('user not found');
    }
    const newVerification = await this.prisma.verification.create({
      data: {
        name: input.name,
        clientWalletAddress: input.clientWalletAddress,
        description: input.description,
        submittedAt: new Date(),
        files: Array.isArray(input.files)
          ? input.files
          : input.files
            ? [input.files]
            : undefined,
        status: 'PENDING',
        completedAt: input.completedAt,
        userId: userId,
      },
    });
  }
}
