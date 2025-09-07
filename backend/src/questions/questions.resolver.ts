import { Resolver, Query, Mutation, Args, ResolveField, Parent, ObjectType, Int, Field } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { Question } from './entities/question.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../common/entities/vote.entity';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionFilterDto,
  VoteDto,
  SearchQuestionsDto,
  QuestionListResponse,
  QuestionVotesResponse,
  QuestionStatsResponse,
  QuestionStatus,
} from './dto/questions.dto';
import { MessageResponse } from '../auth/dto/auth.dto';

@Resolver(() => Question)
export class QuestionsResolver {
  constructor(private questionsService: QuestionsService) {}

  // Question Queries
  @Public()
  @Query(() => Question)
  async question(@Args('id') id: string): Promise<Question> {
    return this.questionsService.findById(id);
  }

  @Public()
  @Query(() => [Question])
  async questions(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
    @Args('status', { nullable: true }) status?: string,
    @Args('groupId', { nullable: true }) groupId?: string,
    @Args('filters', { nullable: true }, ValidationPipe) filters?: QuestionFilterDto,
  ): Promise<Question[]> {
    // Support both old and new argument styles
    const filterDto: QuestionFilterDto = {
      ...(filters || {}),
      skip: skip !== undefined ? skip : filters?.skip,
      take: take !== undefined ? take : filters?.take,
      status: status ? (status as QuestionStatus) : filters?.status,
      groupId: groupId || filters?.groupId,
    };
    
    const { questions } = await this.questionsService.findAll(filterDto);
    return questions;
  }

  @Public()
  @Query(() => [Question])
  async trendingQuestions(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<Question[]> {
    return this.questionsService.getTrendingQuestions(limit);
  }

  @Public()
  @Query(() => [Question])
  async unansweredQuestions(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<Question[]> {
    return this.questionsService.getUnansweredQuestions(limit);
  }

  @Public()
  @Query(() => [Question])
  async highBountyQuestions(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<Question[]> {
    return this.questionsService.getHighBountyQuestions(limit);
  }

  @Public()
  @Query(() => [Question])
  async searchQuestions(@Args('input', ValidationPipe) searchDto: SearchQuestionsDto): Promise<Question[]> {
    return this.questionsService.searchQuestions(searchDto.query, searchDto.limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Question])
  async recommendedQuestions(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Question[]> {
    return this.questionsService.getQuestionRecommendations(user.id, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => [Question])
  async myQuestions(
    @CurrentUser() user: User,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Question[]> {
    return this.questionsService.getQuestionsByUser(user.id, page, limit);
  }

  @Public()
  @Query(() => [Question])
  async questionsByUser(
    @Args('userId') userId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Question[]> {
    return this.questionsService.getQuestionsByUser(userId, page, limit);
  }

  @Public()
  @Query(() => [Question])
  async questionsByGroup(
    @Args('groupId') groupId: string,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<Question[]> {
    return this.questionsService.getQuestionsByGroup(groupId, page, limit);
  }

  @Public()
  @Query(() => QuestionVotesResponse)
  async questionVotes(@Args('questionId') questionId: string): Promise<QuestionVotesResponse> {
    return this.questionsService.getQuestionVotes(questionId);
  }

  // Question Mutations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Question)
  async createQuestion(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) createQuestionDto: CreateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.create(createQuestionDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Question)
  async updateQuestion(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('input', ValidationPipe) updateQuestionDto: UpdateQuestionDto,
  ): Promise<Question> {
    return this.questionsService.update(id, updateQuestionDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Question)
  async updateQuestionStatus(
    @CurrentUser() user: User,
    @Args('id') id: string,
    @Args('status', { type: () => QuestionStatus }) status: QuestionStatus,
  ): Promise<Question> {
    return this.questionsService.updateStatus(id, status, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async deleteQuestion(
    @CurrentUser() user: User,
    @Args('id') id: string,
  ): Promise<MessageResponse> {
    await this.questionsService.delete(id, user.id);
    return { message: 'Question deleted successfully', success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Vote, { nullable: true })
  async voteQuestion(
    @CurrentUser() user: User,
    @Args('questionId') questionId: string,
    @Args('voteType') voteType: 'up' | 'down',
  ): Promise<Vote | null> {
    return this.questionsService.vote(questionId, user.id, voteType);
  }

  // Field Resolvers
  @ResolveField(() => [Vote], { name: 'votes' })
  async votesList(@Parent() question: Question): Promise<Vote[]> {
    return question.votes || [];
  }

  @ResolveField(() => Number)
  async score(@Parent() question: Question): Promise<number> {
    if (!question.votes) return 0;
    
    const upvotes = question.votes.filter(vote => vote.vote_type === 'up').length;
    const downvotes = question.votes.filter(vote => vote.vote_type === 'down').length;
    
    return upvotes - downvotes;
  }

  @ResolveField(() => Number)
  async upvotes(@Parent() question: Question): Promise<number> {
    if (!question.votes) return 0;
    return question.votes.filter(vote => vote.vote_type === 'up').length;
  }

  @ResolveField(() => Number)
  async downvotes(@Parent() question: Question): Promise<number> {
    if (!question.votes) return 0;
    return question.votes.filter(vote => vote.vote_type === 'down').length;
  }


  @ResolveField(() => Number)
  async answerCount(@Parent() question: Question): Promise<number> {
    if (!question.answers) return 0;
    return question.answers.length;
  }

  @ResolveField(() => Boolean)
  async hasAcceptedAnswer(@Parent() question: Question): Promise<boolean> {
    if (!question.answers) return false;
    return question.answers.some(answer => answer.is_accepted);
  }

  @ResolveField(() => String, { nullable: true })
  async userVote(@Parent() question: Question, @CurrentUser() user?: User): Promise<string | null> {
    if (!user || !question.votes) return null;
    
    const userVote = question.votes.find(vote => vote.user.id === user.id);
    return userVote ? userVote.vote_type : null;
  }

  @ResolveField(() => Boolean)
  async canEdit(@Parent() question: Question, @CurrentUser() user?: User): Promise<boolean> {
    if (!user) return false;
    return question.author.id === user.id;
  }

  @ResolveField(() => Boolean)
  async canDelete(@Parent() question: Question, @CurrentUser() user?: User): Promise<boolean> {
    if (!user) return false;
    
    // Can delete if no answers and user is author
    const hasNoAnswers = !question.answers || question.answers.length === 0;
    const isAuthor = question.author.id === user.id;
    
    return hasNoAnswers && isAuthor;
  }

  // CamelCase field resolvers for frontend compatibility
  @ResolveField(() => Number, { name: 'bountyAmount' })
  async bountyAmount(@Parent() question: Question): Promise<number> {
    return question.bounty_amount;
  }

  @ResolveField(() => Number, { name: 'viewCount' })
  async viewCount(@Parent() question: Question): Promise<number> {
    return question.view_count;
  }

  @ResolveField(() => Date, { name: 'createdAt' })
  async createdAt(@Parent() question: Question): Promise<Date> {
    return question.created_at;
  }

  @ResolveField(() => Date, { name: 'updatedAt' })
  async updatedAt(@Parent() question: Question): Promise<Date> {
    return question.updated_at;
  }

  @ResolveField(() => String, { name: 'acceptedAnswerId', nullable: true })
  async acceptedAnswerId(@Parent() question: Question): Promise<string | null> {
    return question.accepted_answer_id || null;
  }

  // _count field resolver for frontend compatibility
  @ResolveField(() => QuestionCounts, { name: '_count' })
  async counts(@Parent() question: Question): Promise<QuestionCounts> {
    return {
      votes: question.votes ? question.votes.length : 0,
      answers: question.answers ? question.answers.length : 0,
    };
  }
}

// Additional ObjectType for _count field
@ObjectType()
class QuestionCounts {
  @Field(() => Int)
  votes: number;

  @Field(() => Int)
  answers: number;
}