import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Like } from './like.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ nullable: true })
  eventId?: number;

  @Column({ nullable: true })
  groupId?: number;

  @Column({ default: 0 })
  likeCount: number;

  @Column()
  createdAt: Date;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => Comment, { nullable: true })
  parentComment?: Comment;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];
}
