import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { ReplyToCommentDto } from './dtos/reply-to-comment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { Serialize } from '../interceptors/serialize.interceptor';
import { CommentResponseDto } from './dtos/comment-response-dto';

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
  ): Promise<CommentResponseDto> {
    return await this.commentsService.createComment(req.user.id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/reply')
  async replyToComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: ReplyToCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.replyToComment(
      commentId,
      req.user.id,
      body,
    );
  }

  @Get('event/:eventId')
  async getEventComments(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 4,
  ): Promise<{
    comments: CommentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    return await this.commentsService.getCommentsForEvent(eventId, page, limit);
  }

  @Get('group/:groupId')
  async getGroupComments(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Query('page', ParseIntPipe) page: number = 1,
    @Query('limit', ParseIntPipe) limit: number = 4,
  ): Promise<{
    comments: CommentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    return await this.commentsService.getCommentsForGroup(groupId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':commentId')
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Body() body: UpdateCommentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CommentResponseDto> {
    return await this.commentsService.updateComment(
      commentId,
      req.user.id,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId')
  async removeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.commentsService.removeComment(commentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':commentId/like')
  async likeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.commentsService.likeComment(commentId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':commentId/like')
  async unlikeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.commentsService.unlikeComment(commentId, req.user.id);
  }
}
