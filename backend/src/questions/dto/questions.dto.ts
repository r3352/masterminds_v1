import { InputType, Field, ObjectType, Int, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, Min, Max, IsBoolean, IsArray, IsEnum } from 'class-validator';

export enum QuestionStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

registerEnumType(QuestionStatus, {
  name: 'QuestionStatus',
  description: 'The status of a question',
});

@InputType()
export class CreateQuestionDto {
  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title: string;

  @Field()
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  content: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  target_group_id?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  bounty_amount?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority_level?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;
}

@InputType()
export class UpdateQuestionDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(10000)
  content?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  target_group_id?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  bounty_amount?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  priority_level?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @Field(() => QuestionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;
}

@InputType()
export class QuestionFilterDto {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  // Support frontend's skip/take pagination
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  take?: number;

  @Field(() => QuestionStatus, { nullable: true })
  @IsOptional()
  @IsEnum(QuestionStatus)
  status?: QuestionStatus;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  target_group_id?: string;

  // Support frontend's groupId argument
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  groupId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  author_id?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  has_bounty?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_urgent?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_bounty?: number;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search_query?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sort_by?: string; // 'created_at', 'bounty_amount', 'view_count', etc.

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sort_order?: string; // 'ASC' or 'DESC'
}

@InputType()
export class VoteDto {
  @Field()
  @IsString()
  question_id: string;

  @Field()
  @IsString()
  vote_type: 'up' | 'down';
}

@InputType()
export class SearchQuestionsDto {
  @Field()
  @IsString()
  @MinLength(1)
  query: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// Response DTOs
@ObjectType()
export class QuestionListResponse {
  @Field(() => [Question])
  questions: Question[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  total_pages: number;
}

@ObjectType()
export class QuestionVotesResponse {
  @Field(() => Int)
  upvotes: number;

  @Field(() => Int)
  downvotes: number;

  @Field({ nullable: true })
  user_vote?: string;
}

@ObjectType()
export class QuestionStatsResponse {
  @Field(() => Int)
  total_questions: number;

  @Field(() => Int)
  open_questions: number;

  @Field(() => Int)
  resolved_questions: number;

  @Field(() => Int)
  total_bounty_amount: number;

  @Field(() => Int)
  avg_response_time_hours: number;
}

// Import Question entity for use in responses
import { Question } from '../entities/question.entity';