import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from 'src/entities/comment.entity';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { ReplyToCommentDto } from './dtos/reply-to-comment.dto';

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
  @UseGuards(JwtAuthGuard)
  @Post(':commentId/reply')
  async replyToComment(@Param('commentId', ParseIntPipe ) commentId: number, @Body() body: ReplyToCommentDto, @Req() req: AuthenticatedRequest): Promise<Comment> {
    const userId = req.user.id
    return await this.commentsService.replyToComment(commentId, userId, body)
  }

  @Get('event/:eventId')
  async getCommentsForEvent(@Param('eventId', ParseIntPipe) eventId: number) {
    return this.commentsService.getCommentsForEvent(eventId)
  }

  @Get('group/:groupId')
  async getCommentsForGroup(@Param('groupId', ParseIntPipe) groupId: number) {
    return this.commentsService.getCommentsForGroup(groupId)
  }

  @Get(':commentId/replies')
  async getReplies(@Param('commentId', ParseIntPipe) commentId: number) {
return await this.commentsService.getReplies(commentId)
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

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/like')
  async likeComment(@Param('commentId', ParseIntPipe) commentId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return await this.commentsService.likeComment(commentId, userId)
  } 

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId/like')
  async unlikeComment(@Param('commentId', ParseIntPipe) commentId: number, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id
    return await this.commentsService.unlikeComment(commentId, userId)
  } 

}
