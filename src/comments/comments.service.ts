import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from '../entities/comment.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UsersService } from '../users/users.service';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { ReplyToCommentDto } from './dtos/reply-to-comment.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { Like } from '../entities/like.entity';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import {
  CommentResponseDto,
  UserResponseDto,
  LikeResponseDto,
} from './dtos/comment-response-dto';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:5173'],
    credentials: true,
  },
})
@Injectable()
export class CommentsService {
  @WebSocketServer()
  private server: Server;

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    private readonly notificationService: NotificationsService,
    private readonly usersService: UsersService,
  ) {}

  async createComment(
    userId: number,
    body: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const user = await this.usersService.findUserById(userId);

    if (!user) throw new NotFoundException('User not found');

    const comment = this.commentRepository.create({
      user,
      content: body.content,
      groupId: body.groupId || null,
      eventId: body.eventId || null,
      likeCount: 0,
      createdAt: new Date(),
      likes: [],
      replies: [],
    });

    const savedComment = await this.commentRepository.save(comment);

    const formattedComment: CommentResponseDto = {
      id: savedComment.id,
      content: savedComment.content,
      groupId: savedComment.groupId,
      eventId: savedComment.eventId,
      likeCount: savedComment.likeCount,
      createdAt: savedComment.createdAt,
      user: this.formatUser(user),
      parentComment: null,
      replies: [],
      likes: [],
    };

    this.server.emit('commentCreated', formattedComment);

    return formattedComment;
  }

  async replyToComment(
    parentCommentId: number,
    userId: number,
    body: ReplyToCommentDto,
  ): Promise<CommentResponseDto> {
    const user = await this.usersService.findUserById(userId);

    if (!user) throw new NotFoundException('User not found');

    const parentComment = await this.commentRepository.findOne({
      where: { id: parentCommentId },
      relations: ['user'],
    });

    if (!parentComment) {
      throw new NotFoundException(
        `Parent comment with the Id ${parentCommentId} not found`,
      );
    }

    const reply = this.commentRepository.create({
      content: body.content,
      user,
      parentComment,
      groupId: parentComment.groupId,
      eventId: parentComment.eventId,
      likeCount: 0,
      createdAt: new Date(),
      likes: [],
      replies: [],
    });

    const savedReply = await this.commentRepository.save(reply);

    if (parentComment.user.id !== user.id) {
      await this.notificationService.createNotification(
        parentComment.user.id,
        user.id,
        'comment-reply',
        `${user.username} replied to your comment`,
        parentComment.eventId ?? undefined,
      );
    }

    const fullReply = await this.commentRepository.findOne({
      where: { id: savedReply.id },
      relations: [
        'user',
        'parentComment',
        'parentComment.user',
        'replies',
        'likes',
        'likes.user',
      ],
    });

    const formattedReply: CommentResponseDto = {
      id: fullReply.id,
      content: fullReply.content,
      groupId: fullReply.groupId,
      eventId: fullReply.eventId,
      likeCount: fullReply.likeCount,
      createdAt: fullReply.createdAt,
      user: this.formatUser(fullReply.user),
      parentComment: {
        id: fullReply.parentComment.id,
        content: fullReply.parentComment.content,
        user: this.formatUser(fullReply.parentComment.user),
      },
      replies: fullReply.replies || [],
      likes: fullReply.likes.map((like) => ({
        id: like.id,
        user: this.formatUser(like.user),
      })),
    };

    this.server.emit('commentReplied', formattedReply);

    return formattedReply;
  }

  async updateComment(
    commentId: number,
    userId: number,
    body: UpdateCommentDto,
  ): Promise<CommentResponseDto> {
    const user = await this.usersService.findUserById(userId);

    if (!user) throw new NotFoundException('User not found');

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: [
        'user',
        'likes',
        'likes.user',
        'parentComment',
        'parentComment.user',
      ],
    });

    if (!comment)
      throw new NotFoundException(`Comment with Id ${commentId} not found.`);

    if (comment.user.id !== userId)
      throw new ForbiddenException('You can only edit your own comments');

    Object.assign(comment, body);

    const updatedComment = await this.commentRepository.save(comment);

    const formattedComment: CommentResponseDto = {
      id: updatedComment.id,
      content: updatedComment.content,
      groupId: updatedComment.groupId,
      eventId: updatedComment.eventId,
      likeCount: updatedComment.likeCount,
      createdAt: updatedComment.createdAt,
      user: this.formatUser(user),
      parentComment: updatedComment.parentComment
        ? {
            id: updatedComment.parentComment.id,
            content: updatedComment.parentComment.content,
            user: this.formatUser(updatedComment.parentComment.user),
          }
        : null,
      replies: updatedComment.replies || [],
      likes: updatedComment.likes.map((like) => ({
        id: like.id,
        user: this.formatUser(like.user),
      })),
    };

    this.server.emit('commentUpdated', formattedComment);

    return formattedComment;
  }

  async removeComment(commentId: number, userId: number) {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['user'],
    });

    if (!comment)
      throw new NotFoundException(
        `Comment with the Id ${commentId} not found.`,
      );

    if (comment.user.id !== userId)
      throw new ForbiddenException('You can only remove your own comments');

    await this.commentRepository.delete(comment.id);

    this.server.emit('commentDeleted', { id: commentId });

    return { message: `Comment with the Id ${commentId} has been deleted` };
  }

  async likeComment(commentId: number, userId: number) {
    const user = await this.usersService.findUserById(userId);

    if (!user) throw new NotFoundException('User not found');

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes', 'likes.user', 'user'],
    });

    if (!comment)
      throw new NotFoundException(`Comment with the Id ${commentId} not found`);

    const existingLike = comment.likes.find((like) => like.user.id === user.id);

    if (existingLike)
      throw new BadRequestException('You have already liked this comment');

    const like = { user, comment };

    await this.likeRepository.save(like);

    const updatedComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes', 'likes.user'],
    });

    updatedComment.likeCount = updatedComment.likes.length;
    await this.commentRepository.save(updatedComment);

    if (comment.user.id !== user.id) {
      await this.notificationService.createNotification(
        comment.user.id,
        user.id,
        'comment-liked',
        `${user.username} liked your comment: ${comment.content}`,
        comment.eventId ?? undefined,
      );
    }

    this.server.emit('commentLiked', {
      id: commentId,
      likes: updatedComment.likes.map((like) => ({
        id: like.id,
        user: this.formatUser(like.user),
      })),
      likeCount: updatedComment.likeCount,
    });

    return { message: 'Comment liked', likes: updatedComment.likeCount };
  }

  async unlikeComment(commentId: number, userId: number) {
    const user = await this.usersService.findUserById(userId);

    if (!user) throw new NotFoundException('User not found');

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes', 'likes.user'],
    });

    if (!comment.likes) {
      comment.likes = [];
    }

    if (!comment)
      throw new NotFoundException(`Comment with the Id ${commentId} not found`);

    const existingLike = comment.likes.find((like) => like.user.id === user.id);

    if (!existingLike)
      throw new NotFoundException('You have not liked this comment');

    await this.likeRepository.delete({ user, comment });

    const updatedComment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['likes', 'likes.user'],
    });

    updatedComment.likeCount -= 1;
    await this.commentRepository.save(updatedComment);

    this.server.emit('commentUnliked', {
      id: commentId,
      likes: updatedComment.likes.map((like) => ({
        id: like.id,
        user: this.formatUser(like.user),
      })),
      likeCount: updatedComment.likeCount,
    });

    return { message: 'Comment unliked', likes: updatedComment.likeCount };
  }

  async getCommentsForEvent(
    eventId: number,
    page: number = 1,
    limit: number = 12,
  ): Promise<{
    comments: CommentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Invalid pagination parameters');
    }

    const [topLevelComments, total] = await this.commentRepository.findAndCount(
      {
        where: { eventId, parentComment: IsNull() },
        relations: ['user', 'likes', 'likes.user'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      },
    );

    const commentIds = topLevelComments.map((comment) => comment.id);
    let allComments: any[] = [];
    if (commentIds.length > 0) {
      const query = `
        WITH RECURSIVE CommentHierarchy AS (
          -- Select top-level comments for the given IDs
          SELECT 
            c.id, 
            c.content, 
            c.created_at, 
            c.event_id, 
            c.group_id, 
            c.parent_comment_id, 
            c.user_id, 
            c.like_count,
            u.username, 
            u.profile_image,
            pc.id AS parent_id,
            pc.content AS parent_content,
            pu.id AS parent_user_id,
            pu.username AS parent_username,
            pu.profile_image AS parent_profile_image
          FROM Comment c
          JOIN User u ON c.user_id = u.id
          LEFT JOIN Comment pc ON c.parent_comment_id = pc.id
          LEFT JOIN User pu ON pc.user_id = pu.id
          WHERE c.id IN (${commentIds.join(',')})

          UNION ALL

          -- Recursively fetch all replies (no limit)
          SELECT 
            c.id, 
            c.content, 
            c.created_at, 
            c.event_id, 
            c.group_id, 
            c.parent_comment_id, 
            c.user_id, 
            c.like_count,
            u.username, 
            u.profile_image,
            pc.id AS parent_id,
            pc.content AS parent_content,
            pu.id AS parent_user_id,
            pu.username AS parent_username,
            pu.profile_image AS parent_profile_image
          FROM Comment c
          INNER JOIN CommentHierarchy ch ON c.parent_comment_id = ch.id
          JOIN User u ON c.user_id = u.id
          LEFT JOIN Comment pc ON c.parent_comment_id = pc.id
          LEFT JOIN User pu ON pc.user_id = pu.id
          WHERE c.event_id = $1
        )
        SELECT * FROM CommentHierarchy
        ORDER BY CASE WHEN parent_comment_id IS NULL THEN 0 ELSE 1 END, created_at DESC;
      `;
      allComments = await this.commentRepository.query(query, [eventId]);
    }

    const commentIdsAll = allComments.map((c) => c.id);
    const commentsWithLikes = await this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.likes', 'likes')
      .leftJoinAndSelect('likes.user', 'user')
      .where('comment.id IN (:...commentIds)', { commentIds: commentIdsAll })
      .getMany();


    const commentMap = new Map<number, CommentResponseDto>();
    allComments.forEach((comment) => {
      const commentWithLikes = commentsWithLikes.find(
        (c) => c.id === comment.id,
      );
      commentMap.set(comment.id, {
        id: comment.id,
        content: comment.content,
        createdAt: new Date(comment.created_at), 
        eventId: comment.event_id,
        groupId: comment.group_id,
        parentComment: comment.parent_comment_id
          ? {
              id: comment.parent_id,
              content: comment.parent_content,
              user: {
                id: comment.parent_user_id,
                username: comment.parent_username,
                profileImage: comment.parent_profile_image || '',
              },
            }
          : null,
        user: {
          id: comment.user_id,
          username: comment.username,
          profileImage: comment.profile_image || '',
        },
        likeCount: comment.like_count || 0,
        likes:
          commentWithLikes?.likes.map((like) => ({
            id: like.id,
            user: {
              id: like.user.id,
              username: like.user.username,
              profileImage: like.user.profileImage || '',
            },
          })) || [],
        replies: [],
      });
    });


    const topLevelFormatted: CommentResponseDto[] = [];
    commentMap.forEach((comment) => {
      if (!comment.parentComment) {
        topLevelFormatted.push(comment);
      } else {
        const parent = commentMap.get(comment.parentComment.id);
        if (parent) {
          parent.replies.push(comment);
        }
      }
    });

    const sortReplies = (comments: CommentResponseDto[]) => {
      comments.forEach((comment) => {
        comment.replies.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        sortReplies(comment.replies);
      });
    };
    sortReplies(topLevelFormatted);

    return {
      comments: topLevelFormatted,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: (page - 1) * limit + topLevelComments.length < total,
    };
  }
  async getCommentsForGroup(
    groupId: number,
    page: number = 1,
    limit: number = 4,
  ): Promise<{
    comments: CommentResponseDto[];
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    if (page < 1 || limit < 1)
      throw new BadRequestException('Invalid pagination parameters');

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { groupId, parentComment: null },
      relations: [
        'user',
        'likes',
        'likes.user',
        'parentComment',
        'parentComment.user',
      ],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const formattedComments = await Promise.all(
      comments.map(
        async (comment) => await this.formatCommentWithReplies(comment),
      ),
    );

    return {
      comments: formattedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    };
  }

  private async formatCommentWithReplies(
    comment: Comment,
    depth: number = 0,
  ): Promise<CommentResponseDto> {
    if (depth > 10) return null; // Prevent infinite recursion

    const replies = await this.commentRepository.find({
      where: { parentComment: { id: comment.id } },
      relations: [
        'user',
        'likes',
        'likes.user',
        'parentComment',
        'parentComment.user',
      ],
      order: { createdAt: 'ASC' },
    });

    const formattedReplies = await Promise.all(
      replies.map(
        async (reply) => await this.formatCommentWithReplies(reply, depth + 1),
      ),
    );

    return {
      id: comment.id,
      content: comment.content,
      groupId: comment.groupId,
      eventId: comment.eventId,
      likeCount: comment.likeCount,
      createdAt: comment.createdAt,
      user: this.formatUser(comment.user),
      parentComment: comment.parentComment
        ? {
            id: comment.parentComment.id,
            content: comment.parentComment.content,
            user: this.formatUser(comment.parentComment.user),
          }
        : null,
      replies: formattedReplies.filter((reply) => reply !== null),
      likes: comment.likes.map((like) => ({
        id: like.id,
        user: this.formatUser(like.user),
      })),
    };
  }

  private formatUser(user: any): UserResponseDto {
    return {
      id: user.id,
      username: user.username,
      profileImage: user.profileImage || '',
    };
  }
}
