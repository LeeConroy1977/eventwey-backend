import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { AuthModule } from 'src/auth/auth.module'; // Import AuthModule
import { Group } from 'src/entities/group.entity';
import { GroupsModule } from 'src/groups/groups.module';
import { AppEvent } from 'src/entities/event.entity';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Group, AppEvent]), // Register entities
    forwardRef(() => AuthModule), // Resolve circular dependency
    forwardRef(() => EventsModule),
    GroupsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
