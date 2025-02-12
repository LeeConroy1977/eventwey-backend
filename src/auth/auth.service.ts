import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from 'src/auth/dtos/create-user-dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signUp(
    username: string,
    email: string,
    password: string,
    res: Response,
  ): Promise<User> {
    const userExists = await this.usersService.findUsersWithEmail(email);

    if (userExists.length > 0) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await this.hashPassword(password);
    const newUser = await this.usersService.createUser(
      username,
      email,
      hashedPassword,
    );
    const token = await this.assignToken({
      id: newUser.id,
      email: newUser.email,
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    });
    return newUser;
  }

  async signIn(email: string, password: string, res: Response): Promise<User> {
    const user = await this.usersService.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const passwordMatch = await this.comparePassword({
      password,
      hash: user.password,
    });

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid password');
    }

    const token = await this.assignToken({
      id: user.id,
      email: user.email,
    });

    if (!token) {
      throw new ForbiddenException('No access token');
    }

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    });

    return user;
  }

  async signout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.send({ message: 'Logged out successfully' });
  }

  // Helper functions

  async hashPassword(password: string) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async comparePassword(agrs: { password: string; hash: string }) {
    return await bcrypt.compare(agrs.password, agrs.hash);
  }

  async assignToken(args: { id: number; email: string }) {
    const payload = args;

    return await this.jwtService.signAsync(payload);
  }
}
