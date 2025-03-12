import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { Like } from "./like.entity";

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @Column({ type: 'int', nullable: true })
  groupId: number | null; 

  @Column({ type: 'int', nullable: true })
  eventId: number | null; 

  @ManyToOne(() => User, (user) => user.comments, { eager: true })
  user: User;

  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies: Comment[];

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true })
  parentComment: Comment | null;

  @OneToMany(() => Like, (like) => like.comment)
  likes: Like[];

  @Column({ default: 0 }) 
  likeCount: number;

  @CreateDateColumn()
  createAt: Date

}
