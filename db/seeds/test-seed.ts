import { DataSource } from 'typeorm';
import { Group } from '../../src/entities/group.entity';
import { User } from '../../src/entities/user.entity';
import { AppEvent } from '../../src/entities/event.entity';

export async function seedTestDatabase(
  dataSource: DataSource,
  data: {
    groupData: any[];
    userData: any[];
    eventData: any[];
  },
) {
  const groupRepository = dataSource.getRepository(Group);
  const userRepository = dataSource.getRepository(User);
  const eventRepository = dataSource.getRepository(AppEvent);

  // Save users first (for groupAdmins and members)
  for (const group of data.groupData) {
    const admins = group.groupAdmins;
    await userRepository.save(admins);
    group.groupAdmins = await userRepository.findByIds(
      admins.map((admin: any) => admin.id),
    );

    // Handle events (assuming eventData is provided or events exist)
    group.events = await eventRepository.findByIds(group.events);

    // Convert creationDate to Date object
    group.creationDate = new Date(group.creationDate);

    await groupRepository.save(group);
  }

  // Save other data (e.g., users, topics)
  await userRepository.save(data.userData);
  await groupRepository.save(data.groupData);
  await eventRepository.save(data.eventData);
}

export async function clearTestDatabase(dataSource: DataSource) {
  const eventRepository = dataSource.getRepository(AppEvent);
  const userRepository = dataSource.getRepository(User);
  const groupRepository = dataSource.getRepository(Group);


  await dataSource.query('TRUNCATE TABLE "events" CASCADE');
  await dataSource.query('TRUNCATE TABLE "group" CASCADE');
  await dataSource.query('TRUNCATE TABLE "user" CASCADE');
}
