import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dtos/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('/')
  async authUser(@Body() input: CreateUserDto) {
    return await this.userService.authUser(input);
  }
}
