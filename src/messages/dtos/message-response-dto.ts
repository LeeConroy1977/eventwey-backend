import { Expose, Transform } from 'class-transformer';


export class MessageResponseDto {
  @Expose() 
  id: number;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  @Transform(({ value }) => value ? { id: value.id, username: value.username, profileImage: value.profileImage } : null)
  sender: { id: number; username: string };

  @Expose()
  @Transform(({ value }) => value ? { id: value.id, username: value.username , profileImage: value.profileImage} : null)
  recipient: { id: number; username: string };
}