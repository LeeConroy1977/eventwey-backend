
import {
    Entity,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Column,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  @Entity()
  export class Message {
    @PrimaryGeneratedColumn()
    id: number;
  
    @ManyToOne(() => User, (user) => user.sentMessages, { eager: true })
    @JoinColumn({ name: 'senderId' })
    sender: User;
  
    @ManyToOne(() => User, (user) => user.receivedMessages, { eager: true })
    @JoinColumn({ name: 'recipientId' })
    recipient: User;
  
    @Column('text')
    content: string;
  
    @CreateDateColumn()
    createdAt: Date;
  }
  