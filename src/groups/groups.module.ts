import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { User } from 'src/entities/user.entity';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AppEvent } from 'src/entities/event.entity';
import { Group } from 'src/entities/group.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Group, User, AppEvent])],
  controllers: [GroupsController],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupsModule {}
