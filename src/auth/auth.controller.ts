import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from 'src/auth/dtos/create-user-dto';
import { User } from 'src/entities/user.entity';
import { Response } from 'express';
import { ResponseUserDto } from 'src/users/dtos/response-user-dto';
import { Serialize } from 'src/interceptors/serialize.interceptor';
import { SignInUserDto } from './dtos/sign-in-user-dto';
import { JwtAuthGuard } from './jwt.guard';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Serialize(ResponseUserDto)
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/whoami')
  whoAmI(@Req() req: AuthenticatedRequest) {
    console.log('req.user:', req.user); // Check if `req.user` is populated
    if (!req.user) {
      throw new Error('User not authenticated'); // Handle missing user
    }
    return this.usersService.findUserById(req.user.id);
  }

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  signUp(
    @Body() body: CreateUserDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    return this.authService.signUp(
      body.username,
      body.email,
      body.password,
      res,
    );
  }
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() body: SignInUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.signIn(body.email, body.password, res);

    return user;
  }

  @Post('signout')
  signout(@Req() req, @Res() res) {
    return this.authService.signout(req, res);
  }
}
