import { Expose, Exclude, Type } from 'class-transformer';
import { Connection } from '../../entities/connection.entity';
import { Group } from '../../entities/group.entity';
import { Like } from '../../entities/like.entity';
import { Message } from '../../entities/message.entity';
import { User } from '../../entities/user.entity';
import { AppEvent } from '../../entities/event.entity';
import { Notification } from '../../entities/notification.entity';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class ResponseUserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  // Exclude sensitive fields
  @Exclude()
  googleId: string;

  @Exclude()
  authMethod: string;

  @Expose()
  profileBackgroundImage: string;

  @Expose()
  profileImage: string;

  @Expose()
  aboutMe: string;

  @Expose()
  bio: string;

  @Expose()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Expose()
  viewEventsStatus: string;

  @Expose()
  viewConnectionsStatus: string;

  @Expose()
  viewGroupsStatus: string;

  @Expose()
  viewTagsStatus: string;

  @Expose()
  viewProfileImage: string;

  @Expose()
  viewBioStatus: string;

  @Expose()
  aboutMeStatus: string;

  @Expose()
  role: string;

  @Expose()
  @Type(() => Group)
  adminGroups: Group[];

  @Expose()
  @Type(() => AppEvent)
  events: AppEvent[];

  @Expose()
  @Type(() => Group)
  groups: Group[];

  @Expose()
  @Type(() => User)
  connections: User[];

  @Expose()
  @Type(() => Connection)
  sentConnections: Connection[];

  @Expose()
  @Type(() => Connection)
  receivedConnections: Connection[];

  @Expose()
  @Type(() => Message) // Serialize nested messages correctly
  sentMessages: Message[];

  @Expose()
  @Type(() => Message)
  receivedMessages: Message[];

  @Expose()
  @Type(() => Like) // Serialize nested likes
  likes: Like[];

  @Expose()
  @Type(() => Notification) // Serialize nested notifications correctly
  notifications: Notification[];

  // Avoid circular references for requester and recipient
  // They will be serialized using ResponseUserDto if necessary
  @Expose()
  @Type(() => ResponseUserDto)
  requester: ResponseUserDto;

  @Expose()
  @Type(() => ResponseUserDto)
  recipient: ResponseUserDto;
}
