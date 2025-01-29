import {
  Injectable,
  forwardRef,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { AppEvent } from 'src/entities/event.entity';
import { EventsService } from 'src/events/events.service';
import { GroupsService } from 'src/groups/groups.service';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(AppEvent) // Ensure this matches the AppEvent entity
    private readonly eventRepository: Repository<AppEvent>, // Correct type here
    private readonly groupsService: GroupsService,
    private readonly eventsService: EventsService,
  ) {}

  async findAllUsers() {
    const users = await this.repo.find({
      relations: ['adminGroups', 'events', 'groups'],
    });

    return plainToInstance(User, users, { strategy: 'excludeAll' });
  }

  async createUser(username: string, email: string, password: string) {
    const user = await this.repo.create({ username, email, password });
    return this.repo.save(user);
  }
  async findUserById(id: number): Promise<User> {
    const user = await this.repo.findOne({
      where: { id },
      relations: ['adminGroups', 'events', 'groups'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return plainToInstance(User, user, { strategy: 'excludeAll' });
  }
  async findUserByEmail(email: string): Promise<User | undefined> {
    const user = await this.repo.findOneBy({ email });
    console.log(user);
    if (!user) return null;

    return user;
  }
  async findUsersWithEmail(email: string) {
    const users = await this.repo.find({
      where: { email: email },
    });

    if (!users) return null;

    return users;
  }

  async findUserEvents(userId: number): Promise<any[]> {
    const user = await this.findUserById(userId);

    const userEventsIds = user.events;

    const events = await this.eventsService.findAllEvents();

    const filteredEvents = events.filter((event) =>
      userEventsIds.includes(event.id),
    );

    return filteredEvents;
  }

  async getAdminGroups(userId: number): Promise<Group[]> {
    const user = await this.findUserById(userId);

    const userAdminIds: number[] = user.adminGroups;

    const groups = await this.groupsService.getAllGroups();

    const filteredGroups = groups.filter((group) =>
      userAdminIds.includes(Number(group.id)),
    );

    return filteredGroups;
  }

  async updateUser(id: number, attrs: Partial<User>) {
    const user = await this.findUserById(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, attrs);
    return this.repo.save(user);
  }

  async removeUser(id: number) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return this.repo.remove(user);
  }
}
