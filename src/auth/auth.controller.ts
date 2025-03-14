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
import { AuthGuard } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string; googleId: string };
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
  ) {
    const user = await this.authService.signIn(body.email, body.password, res);

    return user;
  }

  @Post('signout')
  signout(@Req() req, @Res() res) {
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
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const { googleId, email, username } = req.user; 

 
    const { user, token } = await this.authService.validateGoogleUser({
      googleId,
      email,
      username,
    });

    const userDto = plainToClass(ResponseUserDto, user, {
      excludeExtraneousValues: true,
    });

    return res.json({ token, user: userDto });
  }
}
