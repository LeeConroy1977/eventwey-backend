import { Expose } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';

export class UserDto {
  @IsNumber()
  id: number;

  @IsString()
  username: string;

  @IsString()
  email: string;

  @IsString()
  googleId: string;

  @IsString()
  authMethod: string;

  @IsString()
  profileBackgroundImage: string;

  @IsString()
  profileImage: string;

  @IsString()
  aboutMe: string;

  @IsString()
  bio: string;

  @Expose()
  tags: string[];

  @IsString()
  viewEventsStatus: string;

  @IsString()
  viewConnectionsStatus: string;

  @IsString()
  viewGroupsStatus: string;

  @IsString()
  viewTagsStatus: string;

  @IsString()
  viewProfileImage: string;

  @IsString()
  viewBioStatus: string;

  @IsString()
  aboutMeStatus: string;

  @IsString()
  role: string;

  @IsArray()
  adminGroups: Group[];

  @IsArray()
  events: Event[];

  @IsArray()
  groups: Group[];
}
