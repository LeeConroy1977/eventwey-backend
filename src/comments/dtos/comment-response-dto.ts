import {
  IsNumber,
  IsString,
  IsDate,
  IsArray,
  IsOptional,
} from 'class-validator';

export class UserResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  profileImage: string;
}

export class LikeResponseDto {
  @IsNumber()
  id: number;

  @IsNumber()
  user: UserResponseDto;
}

export class CommentResponseDto {
  @IsNumber()
  id: number;

  @IsString()
  content: string;

  @IsNumber()
  @IsOptional()
  groupId?: number;

  @IsNumber()
  @IsOptional()
  eventId?: number;

  @IsNumber()
  likeCount: number;

  @IsDate()
  createdAt: Date;

  @IsNumber()
  user: UserResponseDto;

  @IsNumber()
  @IsOptional()
  parentComment?: {
    id: number;
    content: string;
    user: UserResponseDto;
  };

  @IsArray()
  replies: CommentResponseDto[];

  @IsArray()
  likes: LikeResponseDto[];
}
