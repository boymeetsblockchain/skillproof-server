import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { CONFIGS } from 'src/configs';
import { PrismaService } from 'src/modules/global/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      console.log('1');
      throw new UnauthorizedException();
    }
    try {
      interface JwtPayload {
        id: string;
        [key: string]: any;
      }
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: CONFIGS.JWT_SECRET,
      });

      console.log('2');
      if (!payload.id) throw new UnauthorizedException();
      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.id,
        },
      });
      // so that we can access it in our route handlers
      if (!user) throw new UnauthorizedException();

      request['user'] = user;

      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
