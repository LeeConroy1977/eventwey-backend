import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Comment } from 'src/entities/comment.entity';
import { Repository } from 'typeorm';
import { CreateCommentDto } from './dtos/create-comment-dto';
import { UsersService } from 'src/users/users.service';
import { UpdateCommentDto } from './dtos/update-comment-dto';


@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,

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
}
