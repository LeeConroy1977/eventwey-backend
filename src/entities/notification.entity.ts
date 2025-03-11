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
  @JoinColumn({ name: 'userId' }) // ✅ Ensure correct mapping
  user: User;

  @Column()
  userId: number; // ✅ Store user ID separately

  @Column()
  senderId: number;

  @Column()
  type: string; // e.g., "event-invite", "event-attendance"

  @Column()
  message: string;

  @Column({ nullable: true })
  eventId: number;

  @Column({ default: false })
  isRead: boolean; // Mark if the user has seen the notification

  @CreateDateColumn()
  createdAt: Date;
}
