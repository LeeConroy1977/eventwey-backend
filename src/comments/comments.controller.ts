import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { ReplyToCommentDto } from './dtos/reply-to-comment.dto';
import { Serialize } from '../interceptors/serialize.interceptor';

interface AuthenticatedRequest extends Request {
  user: { id: number; username: string; email: string };
}

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createComment(
    @Body() body: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Comment> {
    const userId = req.user.id;
    return await this.commentsService.createComment(userId, body);
  }

  @Post(':commentId/reply')
  async replyToComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
    @Body() body: ReplyToCommentDto,
  ) {
    const userId = req.user.id;
    const comment = await this.commentsService.replyToComment(
      commentId,
      userId,
      body,
    );
    return {
      id: comment.id,
      content: comment.content,
      groupId: comment.groupId,
      eventId: comment.eventId,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      parentComment: comment.parentComment
        ? {
            id: comment.parentComment.id,
            content: comment.parentComment.content,
            user: comment.parentComment.user
              ? {
                  id: comment.parentComment.user.id,
                  username: comment.parentComment.user.username,
                  profileImage: comment.parentComment.user.profileImage,
                }
              : null,
          }
        : null,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        profileImage: comment.user.profileImage,
      },
      replies: comment.replies || [],
      likes: comment.likes || [],
    };
  }

  @Get('event/:eventId')
  async getEventComments(
    @Param('eventId') eventId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '4',
  ) {
    return this.commentsService.getCommentsForEvent(
      eventId,
      Number(page),
      Number(limit),
    );
  }

  @Get('group/:groupId')
  async getgroupComments(
    @Param('groupId') groupId: number,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '4',
  ) {
    return this.commentsService.getCommentsForEvent(
      groupId,
      Number(page),
      Number(limit),
    );
  }

  @Get(':commentId/replies')
  async getReplies(@Param('commentId', ParseIntPipe) commentId: number) {
    return await this.commentsService.getReplies(commentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.commentsService.updateComment(commentId, userId, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async removeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.commentsService.removeComment(commentId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/like')
  async likeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return await this.commentsService.likeComment(commentId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId/like')
  async unlikeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return await this.commentsService.unlikeComment(commentId, userId);
  }
}
