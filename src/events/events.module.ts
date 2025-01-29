import { forwardRef, Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';
import { User } from 'src/entities/user.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AppEvent, User]), // Register AppEvent and User entities
    forwardRef(() => UsersModule), // Resolve circular dependency if UsersModule is needed
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
