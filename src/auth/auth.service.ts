import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
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
    const token = await this.assignToken({ id: user.id, email: user.email });
    if (!token) {
      throw new ForbiddenException('No access token');
    }
    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // change when hosting frontend
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });
    console.log('Cookie set in signIn:', token); 
    console.log('Response headers before return:', res.getHeaders());
    return this.userRepository.findOne({
      where: { id: user.id },
      loadRelationIds: true,
    });
  }

  async signout(req: any, res: Response): Promise<{ message: string }> {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
  }

  async validateGoogleUser(user: any, res: Response): Promise<User> {
    let existingUser: User | null = await this.usersService.findUserByGoogleId(
      user.googleId,
    );
    if (!existingUser) {
      const newUser = this.userRepository.create({
        username: user.displayName || `${user.given_name} ${user.family_name}`,
        email: user.email,
        googleId: user.googleId,
        authMethod: 'google',
        profileImage:
          user.photos && user.photos[0] ? user.photos[0].value : null,
      });
      const savedUser = await this.userRepository.save(newUser);
      existingUser = Array.isArray(savedUser) ? savedUser[0] : savedUser;
    }
    const token = await this.assignToken({
      id: existingUser.id,
      email: existingUser.email,
    });
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
    });
    return existingUser;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(args: {
    password: string;
    hash: string;
  }): Promise<boolean> {
    return bcrypt.compare(args.password, args.hash);
  }

  async assignToken(args: { id: number; email: string }): Promise<string> {
    return this.jwtService.signAsync(args);
  }
}
