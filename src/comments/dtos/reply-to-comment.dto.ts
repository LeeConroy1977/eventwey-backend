import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyToCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}