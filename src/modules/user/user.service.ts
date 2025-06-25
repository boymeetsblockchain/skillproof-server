import { Injectable } from '@nestjs/common';
import { PrismaService } from '../global/prisma/prisma.service';
import { CreateUserDto } from './dtos/user.dto';
import * as jwt from 'jsonwebtoken';
import { generateRandomString } from '../global/utils/random';
import { CONFIGS } from 'src/configs';
import { TOKEN_TYPE } from 'generated/prisma/client';
import { addDays } from 'date-fns';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  //   todo user connect
  private async __generateAuthTokens(id: string) {
    const expirationTime = new Date();
    expirationTime.setDate(expirationTime.getHours() + 1);
    const accessToken = jwt.sign({ id: `${id}` }, CONFIGS.JWT_SECRET, {
      expiresIn: '1h',
    });

    const refreshToken = generateRandomString(60);

    const refreshTokenjsonwebtoken = jwt.sign(
      { token: refreshToken },
      CONFIGS.JWT_SECRET,
      { expiresIn: '30d' },
    );
    const expires_at = addDays(new Date(), 30);

    await this.prisma.userToken.create({
      data: {
        token: refreshToken,
        type: TOKEN_TYPE.REFRESH,
        user_id: id,
        expires_at,
      },
    });

    return { _access: accessToken, _refresh: refreshTokenjsonwebtoken };
  }

  async authUser(input: CreateUserDto) {
    const userExists = await this.prisma.user.findUnique({
      where: {
        walletAddress: input.walletAddress,
      },
    });
    if (userExists) {
      const { _access, _refresh } = await this.__generateAuthTokens(
        userExists.id,
      );
      return {
        _access,
        _refresh,
      };
    } else {
      const user = await this.prisma.user.create({
        data: {
          walletAddress: input.walletAddress,
        },
      });
      const { _access, _refresh } = await this.__generateAuthTokens(user.id);
      return {
        _access,
        _refresh,
      };
    }
  }
}
