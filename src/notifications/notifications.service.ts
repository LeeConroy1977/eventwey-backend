import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from 'src/entities/notification.entity';
import { User } from 'src/entities/user.entity';
import { AppEvent } from 'src/entities/event.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,

    @InjectRepository(AppEvent)
    private readonly eventRepository: Repository<AppEvent>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllNotifications() {
    return await this.notificationRepository.find();
  }

  async createNotification(
    userId: number,
    senderId: number,
    type: string,
    message: string,
    eventId?: number,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let event = null;
    if (eventId) {
      event = await this.eventRepository.findOne({ where: { id: eventId } });
      if (!event) throw new Error('Event not found');
    }

    const notification = this.notificationRepository.create({
      user,
      senderId,
      type,
      message,
      eventId,
    });

    return await this.notificationRepository.save(notification);
  }

  async getUserNotifications(userId: number) {
    return await this.notificationRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: number) {
    await this.notificationRepository.update(notificationId, { isRead: true });
    return { message: 'Notification marked as read' };
  }

  async removeNotification(notificationId: number) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId },
    });

    if (!notification) throw new Error('Notification not found');

    await this.notificationRepository.remove(notification);
    return { message: 'Notification removed' };
  }
}
