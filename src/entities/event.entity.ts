import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { Expose, Transform } from 'class-transformer';

@Entity('events') // Keep the table name the same
export class AppEvent {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  image: string;

  @Column()
  @Expose()
  date: number; // UNIX timestamp

  @Column()
  @Expose()
  startTime: string;

  @Column()
  @Expose()
  title: string;

  @ManyToOne(() => Group, (group) => group.events, { nullable: false })
  @Expose()
  @Transform(({ value }) => value?.id)
  group: Group; // Foreign key to Group

  @Column()
  @Expose()
  duration: string;

  @Column({ default: 0 })
  @Expose()
  going: number;

  @ManyToMany(() => User, (user) => user.events, { cascade: true })
  @JoinTable() // Join table to handle many-to-many relationship
  @Transform(({ obj }) => obj.attendees?.map((attendee: User) => attendee.id)) // Map attendees to IDs
  @Expose()
  attendees: User[];

  @Column()
  @Expose()
  capacity: number;

  @Column()
  @Expose()
  availability: number;

  @Column({ default: false })
  @Expose()
  free: boolean;

  @Column('json', { nullable: true })
  priceBands: { type: string; price: string; ticketCount: number }[];

  @Column('simple-array')
  @Expose()
  tags: string[];

  @Column()
  @Expose()
  category: string;

  @Column('simple-array', { nullable: true })
  @Expose()
  description: string[];

  @Column('json', { nullable: true })
  @Expose()
  location: {
    placename: string;
    lat: number;
    lng: number;
  };

  @Column({ default: false })
  @Expose()
  approved: boolean;
}
