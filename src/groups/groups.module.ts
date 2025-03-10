import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { AppEvent } from 'src/entities/event.entity';
import { EventsModule } from 'src/events/events.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, User, AppEvent]), // Register entities for Groups module
    forwardRef(() => EventsModule), // Import EventsModule to resolve EventRepository
  ],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
