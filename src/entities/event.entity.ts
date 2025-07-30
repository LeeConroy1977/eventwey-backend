import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
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

  @Column({ type: 'bigint' })
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
  group: Group;

  @Column()
  @Expose()
  duration: string;

  @Column({ default: 0 })
  @Expose()
  going: number;

  @ManyToMany(() => User, (user) => user.events, { cascade: true })
  @JoinTable()
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

  @Column('text', { array: true, nullable: true, default: [] })
  @Expose()
  tags: string[] = [];

  @Column()
  @Expose()
  category: string;

  @Column('text', { array: true, nullable: true })
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

  @CreateDateColumn()
  @Expose()
  createdAt: Date;
}
