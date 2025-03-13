import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UsersService } from 'src/users/users.service';
import { UpdateCommentDto } from './dtos/update-comment-dto';
import { ReplyToCommentDto } from './dtos/reply-to-comment.dto';
import { NotificationsService } from 'src/notifications/notifications.service';
import { Like } from 'src/entities/like.entity';


@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
        private readonly notificationService: NotificationsService,
        private readonly usersService: UsersService,

        
    ) {}

    async createComment(userId: number, body: CreateCommentDto) {
        const user = await this.usersService.findUserById(userId)

        if(!user) throw new NotFoundException('User not found')

       const comment =  this.commentRepository.create({
        user,
        content: body.content,
        groupId: body.groupId || null,
        eventId: body.eventId || null,
        likeCount: 0
       })     

       return await this.commentRepository.save(comment)
    }

    async getReplies(commentId: number){
        const comment = await this.commentRepository
        .createQueryBuilder('comment')
        .leftJoinAndSelect('comment.replies', 'replies')
        .leftJoinAndSelect('replies.user', 'user') 
        .where('comment.id = :commentId', { commentId })
        .getOne();

        if (!comment) throw new NotFoundException(`Comment with the Id ${commentId} not found`)

        return comment.replies    


    }

    async replyToComment(parentCommentId: number, userId: number, body: ReplyToCommentDto) {
        const user = await this.usersService.findUserById(userId)   

        if (!user) throw new NotFoundException('User not found')

        const parentComment = await this.commentRepository.findOne({where: {id: parentCommentId}, relations: ['user']})

        if (!parentComment) throw new NotFoundException(`Parent comment with the Id ${parentCommentId} not found`)

            const reply = this.commentRepository.create({
                content: body.content,
                user,
                parentComment,
                groupId: parentComment.groupId,
                eventId: parentComment.eventId
            })

            const savedReply = await this.commentRepository.save(reply)

            if (parentComment.user.id !== user.id) {
                await this.notificationService.createNotification(
                    parentComment.user.id,
                    user.id,
                    'comment-reply',
                    `${user.username} replied to your comment`,
                    parentComment.eventId ?? undefined 


                )
            }


            return savedReply

         
    }

    async getCommentsForEvent(eventId: number) {
        return this.commentRepository.find({where: {eventId}})
    }

    async getCommentsForGroup(groupId: number) {
        return this.commentRepository.find({where: {groupId}})
    }

    async updateComment(commentId: number, userId: number, body: UpdateCommentDto) {
        const comment = await this.commentRepository.findOne({where: {id: commentId}, relations: ['user']})

        if(!comment) throw new NotFoundException(`Comment with Id ${commentId} not found.`)

        if (comment.user.id !== userId) throw new ForbiddenException('You can only edit your own comments')    

        Object.assign(comment, body)
        
        return this.commentRepository.save(comment)
    }

    async removeComment(commentId: number, userId: number) {
        const comment = await this.commentRepository.findOne({where: {id: commentId}, relations: ['user']})

        if (!comment) throw new NotFoundException(`Comment with the Id ${commentId} not found.`)

        if (comment.user.id !== userId) throw new ForbiddenException('You can only remove your own comments')    

        await this.commentRepository.delete(comment.id)
        
        return {message: `Comment with the Id ${commentId} has been deleted`}
    }

    async likeComment(commentId: number, userId: number) {
        const user = await this.usersService.findUserById(userId)

        if(!user) throw new NotFoundException('User not found')
        
            const comment = await this.commentRepository.findOne({
                where: { id: commentId },
                relations: ['likes', 'likes.user'], 
            });
        
        if (!comment) throw new NotFoundException(`Comment with the Id ${commentId} not found`)
            console.log('Likes for this comment:', comment.likes.map(like => like.user.id));


   const existingLike = comment.likes.find(like => like.user.id === user.id);


   if (existingLike) throw new BadRequestException('You have already liked this comment');
 


        const like = {
            user,
            comment
        }  
        
        await this.likeRepository.save(like)

        const updatedComment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['likes'],
          });

          updatedComment.likeCount = updatedComment.likes.length;
        await this.commentRepository.save(updatedComment)

         if (comment.user.id !== user.id) {
                await this.notificationService.createNotification(
                    comment.user.id,
                    user.id,
                    'comment-liked',
                    `${user.username} liked your comment: ${comment.content}`,
                    comment.eventId ?? undefined 


                )
            }

        return {message: 'Comment liked', likes: updatedComment.likeCount}
    }

    async unlikeComment(commentId: number, userId: number) {
        const user = await this.usersService.findUserById(userId)

        if(!user) throw new NotFoundException('User not found')
        
        const comment = await this.commentRepository.findOne({where: {id: commentId}, relations:['likes', 'likes.user']})

        if (!comment.likes) {
            comment.likes = [];
        }

        if (!comment) throw new NotFoundException(`Comment with the Id ${commentId} not found`)
            console.log('Likes:', comment.likes);
            const existingLike = comment.likes.find(like => like.user.id === user.id)   

        if(!existingLike) throw new NotFoundException('You have not liked this comment')

       
            await this.likeRepository.delete({ user: user, comment: comment });

            const updatedComment = await this.commentRepository.findOne({
                where: { id: commentId },
                relations: ['likes'],
              });

              updatedComment.likeCount -= 1
            await this.commentRepository.save(updatedComment)

            return {message: 'comment unliked', likes: updatedComment.likeCount}
    }
}
