import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Group } from './group.entity';
import { User } from './user.entity';
import { Expose, Transform } from 'class-transformer';

@Entity('events') 
export class AppEvent {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column()
  @Expose()
  image: string;

  @Column()
  @Expose()
  date: number; 

  @Column()
  @Expose()
  startTime: string;

  @Column()
  @Expose()
  title: string;

  @ManyToOne(() => Group, (group) => group.events, { nullable: false })
  @JoinColumn({ name: 'groupId' }) 
  @Expose()
  @Transform(({ value }) => value?.id) 
  group: Group;

  @Column()
  @Expose()
  duration: string;

  @Column({ default: 0 })
  @Expose()
  going: number;

  @ManyToMany(() => User, (user) => user.events, { cascade: true })
  @JoinTable() 
  @Transform(({ obj }) => obj.attendees?.map((attendee: User) => attendee.id)) 
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
