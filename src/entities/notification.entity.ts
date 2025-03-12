import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' }) 
  user: User;

  @Column()
  userId: number; 

  @Column()
  senderId: number;

  @Column()
  type: string; 

  @Column()
  message: string;

  @Column({ nullable: true })
  eventId: number;

  @Column({ default: false })
  isRead: boolean; 

  @CreateDateColumn()
  createdAt: Date;
}
