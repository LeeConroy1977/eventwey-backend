import { Expose, Type } from 'class-transformer';

export class GroupDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  image: string;

  @Expose()
  description: string[];

  @Expose()
  openAccess: boolean;

  @Expose()
  creationDate: Date;

  @Expose()
  category: string;

  @Expose()
  approved: boolean;

  @Expose()
  location: {
    placename: string;
    lat: number;
    lng: number;
  };

  @Expose()
  @Type(() => Number) 
  groupAdmins: number[];

  @Expose()
  @Type(() => Number) 
  events: number[];

  @Expose()
  @Type(() => Number) 
  members: number[];
}
