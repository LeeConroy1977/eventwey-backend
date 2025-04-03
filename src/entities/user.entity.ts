import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Group } from './group.entity';
import { AppEvent } from './event.entity';
import { Expose, Transform } from 'class-transformer';
import { Connection } from './connection.entity';
import { Notification } from './notification.entity';
import { Comment } from './comment.entity';
import { Like } from './like.entity';
import { Message } from './message.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  @Expose()
  id: number;

  @Column({ unique: true, nullable: true })
  @Expose()
  email: string;

  @Column({ nullable: true })
  @Expose()
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  @Expose()
  googleId: string;

  @Column({ default: 'email' })
  @Expose()
  authMethod: string;

  @Column({ nullable: true })
  @Expose()
  profileBackgroundImage: string;

  @Column({ nullable: true })
  @Expose()
  profileImage: string;

  @Column({ nullable: true })
  @Expose()
  aboutMe: string;

  @Column({ nullable: true })
  @Expose()
  bio: string;

  @Column('simple-array', { nullable: true, default: [] })
  @Expose()
  tags: string[];

  @Column({ default: 'public' })
  @Expose()
  viewEventsStatus: string;

  @Column({ default: 'public' })
  @Expose()
  viewConnectionsStatus: string;

  @Column({ default: 'public' })
  @Expose()
  viewGroupsStatus: string;

  @Column({ default: 'public' })
  @Expose()
  viewTagsStatus: string;

  @Column({ default: 'public' })
  @Expose()
  viewProfileImage: string;

  @Column({ default: 'public' })
  @Expose()
  viewBioStatus: string;

  @Column({ default: 'public' })
  @Expose()
  aboutMeStatus: string;

  @Column({ default: 'user' })
  @Expose()
  role: string;

  @ManyToMany(() => Group, (group) => group.groupAdmins, { cascade: true })
  @Transform(
    ({ obj }) => obj.adminGroups?.map((group: Group) => group.id) || [],
  )
  @Expose()
  adminGroups: Group[];

  @ManyToMany(() => Group, (group) => group.members, { cascade: true })
  @JoinTable()
  @Transform(({ obj }) => obj.groups?.map((group: Group) => group.id) || [])
  @Expose()
  groups: Group[];

  @ManyToMany(() => AppEvent, (event) => event.attendees)
  @Transform(({ obj }) => obj.events?.map((event: AppEvent) => event.id) || [])
  @Expose()
  events: Event[];

  @ManyToMany(() => User, (user) => user.connections)
  @JoinTable({
    name: 'user_connections',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'connectionId', referencedColumnName: 'id' },
  })
  connections: User[];

  @OneToMany(() => Connection, (connection) => connection.requester)
  sentConnections: Connection[];

  @OneToMany(() => Connection, (connection) => connection.recipient)
  receivedConnections: Connection[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.user)
  likes: Like[];

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.recipient)
  receivedMessages: Message[];
}
