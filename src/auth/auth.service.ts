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
import { UsersService } from '..//users/users.service';
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

    return await this.userRepository.findOne({
      where: {
        id: user.id,
      },
      loadRelationIds: true,
    });
  }

  async signout(req: Request, res: Response) {
    res.clearCookie('token');
    return res.send({ message: 'Logged out successfully' });
  }

  async validateGoogleUser(user: any) {
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

      if (Array.isArray(savedUser)) {
        existingUser = savedUser[0];
      } else {
        existingUser = savedUser;
      }
    }

    const token = this.jwtService.sign({ userId: existingUser.id });

    return { user: existingUser, token };
  }

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
