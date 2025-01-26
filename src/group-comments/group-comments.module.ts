import { Module } from '@nestjs/common';
import { GroupCommentsController } from './group-comments.controller';
import { GroupCommentsService } from './group-comments.service';

@Module({
  controllers: [GroupCommentsController],
  providers: [GroupCommentsService]
})
export class GroupCommentsModule {}
