import { IsNotEmpty, IsInt, ValidateIf } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty()
  content: string;

  @ValidateIf((obj) => obj.eventId === undefined) 
  @IsInt()
  groupId?: number;

  @ValidateIf((obj) => obj.groupId === undefined) 
  @IsInt()
  eventId?: number;
}