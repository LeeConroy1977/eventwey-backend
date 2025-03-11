import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Connection {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.sentConnections, { eager: true })
  @JoinColumn({ name: 'requesterId' })
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedConnections, { eager: true })
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ type: 'text', default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
