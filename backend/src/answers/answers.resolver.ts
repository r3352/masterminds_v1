import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { AnswersService } from './answers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Answer } from './entities/answer.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../common/entities/vote.entity';
import { CreateAnswerDto, UpdateAnswerDto } from './dto/answers.dto';
import { AnswerCountDto } from './dto/count.dto';
import { MessageResponse } from '../auth/dto/auth.dto';

@Resolver(() => Answer)
export class AnswersResolver {
  constructor(private answersService: AnswersService) {}

  @Public()
  @Query(() => Answer)
  async answer(@Args('id') id: string): Promise<Answer> {
    return this.answersService.findById(id);
  }

  @Public()
  @Query(() => [Answer])
  async answersByQuestion(@Args('questionId') questionId: string): Promise<Answer[]> {
    return this.answersService.findByQuestion(questionId);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Answer])
  async myAnswers(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Answer[]> {
    return this.answersService.getAnswersByUser(user.id, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Answer)
  async createAnswer(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) createAnswerDto: CreateAnswerDto,
  ): Promise<Answer> {
    return this.answersService.create(createAnswerDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Answer)
  async updateAnswer(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('input', ValidationPipe) updateAnswerDto: UpdateAnswerDto,
  ): Promise<Answer> {
    return this.answersService.update(id, updateAnswerDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async deleteAnswer(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<MessageResponse> {
    await this.answersService.delete(id, user.id);
    return { message: 'Answer deleted successfully', success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Answer)
  async acceptAnswer(
    @CurrentUser() user: User,
    @Args('answerId') answerId: string,
  ): Promise<Answer> {
    return this.answersService.acceptAnswer(answerId, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Vote, { nullable: true })
  async voteAnswer(
    @CurrentUser() user: User,
    @Args('answerId') answerId: string,
    @Args('voteType') voteType: 'up' | 'down',
  ): Promise<Vote | null> {
    return this.answersService.vote(answerId, user.id, voteType);
  }

  @ResolveField(() => Number)
  async score(@Parent() answer: Answer): Promise<number> {
    if (!answer.votes) return 0;
    
    const upvotes = answer.votes.filter(vote => vote.vote_type === 'up').length;
    const downvotes = answer.votes.filter(vote => vote.vote_type === 'down').length;
    
    return upvotes - downvotes;
  }

  @ResolveField(() => [Vote], { name: 'votes' })
  async votesList(@Parent() answer: Answer): Promise<Vote[]> {
    return answer.votes || [];
  }

  @ResolveField(() => AnswerCountDto, { name: '_count' })
  async count(@Parent() answer: Answer): Promise<AnswerCountDto> {
    const votesCount = answer.votes ? answer.votes.length : 0;
    return {
      votes: votesCount,
    };
  }
}