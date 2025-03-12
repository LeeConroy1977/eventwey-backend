import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from 'src/entities/comment.entity';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { UpdateCommentDto } from './dtos/update-comment-dto';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}


@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
 async createComment(@Body() body: CreateCommentDto, @Req() req: AuthenticatedRequest): Promise<Comment>   {
const userId = req.user.id
return  await this.commentsService.createComment(userId, body)
  }

  @Get('event/:eventId')
  async getCommentsForEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.commentsService.getCommentsForEvent(eventId)
  }

  @Get('group/:groupId')
  async getCommentsForGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.commentsService.getCommentsForGroup(groupId)
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async updateComment(@Param('commentId', ParseIntPipe) commentId: number, @Body() body: UpdateCommentDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return this.commentsService.updateComment(commentId, userId, body)
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async removeComment(@Param('commentId', ParseIntPipe) commentId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return this.commentsService.removeComment(commentId,userId)
  }

}
