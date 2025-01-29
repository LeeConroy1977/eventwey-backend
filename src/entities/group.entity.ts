import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  ManyToMany,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { AppEvent } from './event.entity';
import { Exclude, Expose, Transform, Type } from 'class-transformer';

class Location {
  @Expose()
  placename: string;

  @Expose()
  lat: number;

  @Expose()
  lng: number;
}

@Entity()
@Expose()
export class Group {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  name: string;

  @Column()
  @Expose()
  image: string;

  @Column('simple-array')
  @Expose()
  description: string[];

  @Column({ default: true })
  @Expose()
  openAccess: boolean;

  @Column('json', { nullable: true }) // Define 'location' as a JSON column
  @Expose() // Make sure location is exposed when transforming
  @Type(() => Location)
  location: {
    placename: string;
    lat: number;
    lng: number;
  };

  @CreateDateColumn()
  @Expose()
  creationDate: Date;

  @Column()
  @Expose()
  category: string;

  @Column({ default: false })
  @Expose()
  approved: boolean;

  @ManyToMany(() => User, (user) => user.groups)
  @Expose()
  @Transform(({ obj }) => obj.members?.map((user: User) => user.id) || [])
  members: User[];

  @ManyToMany(() => User, (user) => user.adminGroups)
  @Expose()
  @Transform(({ obj }) => obj.groupAdmins?.map((user: User) => user.id) || [])
  groupAdmins: User[];

  @OneToMany(() => AppEvent, (event) => event.group, { cascade: true })
  @Transform(({ obj }) => obj.events?.map((event: AppEvent) => event.id) || [])
  events: Event[]; // One-to-many relationship with Event
}
