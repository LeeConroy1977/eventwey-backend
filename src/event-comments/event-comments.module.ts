import { Module } from '@nestjs/common';
import { EventCommentsController } from './event-comments.controller';
import { EventCommentsService } from './event-comments.service';

@Module({
  controllers: [EventCommentsController],
  providers: [EventCommentsService]
})
export class EventCommentsModule {}
