import { IsEmail, IsStrongPassword, Max } from 'class-validator';

export class SignInUserDto {
  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;
}
