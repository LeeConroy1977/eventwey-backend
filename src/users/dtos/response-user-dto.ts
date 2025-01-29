import { Expose } from 'class-transformer';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';

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
}
