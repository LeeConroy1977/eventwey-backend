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
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dtos/create-user-dto';
import { User } from '../entities/user.entity';
import { Response, Request } from 'express';
import { ResponseUserDto } from '../users/dtos/response-user-dto';
import { Serialize } from '../interceptors/serialize.interceptor';
import { SignInUserDto } from './dtos/sign-in-user-dto';

import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';
import { JwtAuthGuard } from './jwt.guard';

// Interface for JwtAuthGuard (matches JwtCookieStrategy payload)
interface JwtAuthenticatedRequest extends Request {
  user: { id: number; email: string };
}

// Interface for GoogleStrategy (matches Google auth data)
interface GoogleAuthenticatedRequest extends Request {
  user: { id: string; email: string; username?: string }; // googleId as string
}

// @Serialize(ResponseUserDto)
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('/whoami')
  whoAmI(@Req() req: JwtAuthenticatedRequest): Promise<User> {
    console.log('req.user:', req.user);
    if (!req.user) {
      throw new Error('User not authenticated');
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
  ): Promise<User> {
    return this.authService.signIn(body.email, body.password, res);
  }

  @Post('signout')
  @HttpCode(HttpStatus.OK)
  signout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<{ message: string }> {
    return this.authService.signout(req, res);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(@Req() req: any) {
    console.log('Inside googleAuth route');
  }

  @Serialize(ResponseUserDto)
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: GoogleAuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    const { id: googleId, email, username } = req.user;
    const user = await this.authService.validateGoogleUser(
      { googleId, email, username },
      res,
    );
    return user;
  }
}
