import { Expose, Type } from 'class-transformer';
import { Connection } from 'src/entities/connection.entity';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';
import { Like } from 'src/entities/like.entity';
import { Message } from 'src/entities/message.entity';
import { User } from 'src/entities/user.entity';

export class ResponseUserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  googleId: string;

  @Expose()
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
  tags: string[];

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
  adminGroups: Group[];

  @Expose()
  events: Event[];

  @Expose()
  groups: Group[];

  @Expose()
  connections: User[];

  @Expose()
  sentConnections: Connection[];

  @Expose()
  receivedConnections: Connection[];

  @Expose()
  notifications: Notification[];

  @Expose()
  comments: Comment[]

  @Expose()
  likes: Like[]

  @Expose()
  @Type(() => ResponseUserDto) 
  requester: ResponseUserDto;

  @Expose()
  @Type(() => ResponseUserDto)
  recipient: ResponseUserDto;

  @Expose()
    sentMessages: Message[];
  
    @Expose()
    receivedMessages: Message[];
}
