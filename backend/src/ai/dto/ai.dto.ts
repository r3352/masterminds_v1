import { InputType, Field, ObjectType, Float, Int, registerEnumType } from '@nestjs/graphql';
import { IsString, IsOptional, MinLength, MaxLength, IsNumber, Min, Max, IsEnum } from 'class-validator';

export enum SearchType {
  ALL = 'all',
  QUESTIONS = 'questions',
  ANSWERS = 'answers',
}

registerEnumType(SearchType, {
  name: 'SearchType',
  description: 'The type of content to search for',
});

@InputType()
export class GenerateAnswerDto {
  @Field()
  @IsString()
  question_id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  additional_context?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(100)
  @Max(4000)
  max_tokens?: number;
}

@InputType()
export class SemanticSearchDto {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  query: string;

  @Field(() => SearchType, { defaultValue: SearchType.ALL })
  @IsOptional()
  @IsEnum(SearchType)
  search_type?: SearchType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_similarity?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  group_id?: string;
}

@InputType()
export class ExpertRoutingDto {
  @Field()
  @IsString()
  question_id: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  max_experts?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  min_expertise_level?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  min_similarity_threshold?: number;
}

@InputType()
export class SimilarContentDto {
  @Field()
  @IsString()
  content_id: string;

  @Field()
  @IsString()
  content_type: 'question' | 'answer';

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  limit?: number;
}

// Response DTOs
@ObjectType()
export class GeneratedAnswerResponse {
  @Field()
  answer: string;

  @Field(() => Float)
  confidence: number;

  @Field(() => [AnswerSource])
  sources: AnswerSource[];

  @Field(() => Int)
  tokens_used: number;

  @Field()
  model_used: string;
}

@ObjectType()
export class AnswerSource {
  @Field()
  type: string; // 'question', 'answer', 'document'

  @Field()
  id: string;

  @Field(() => Float)
  similarity: number;

  @Field()
  title: string;

  @Field({ nullable: true })
  content_preview?: string;

  @Field({ nullable: true })
  author?: string;
}

@ObjectType()
export class SemanticSearchResult {
  @Field()
  id: string;

  @Field()
  type: string; // 'question' or 'answer'

  @Field(() => Float)
  similarity: number;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field({ nullable: true })
  author?: string;

  @Field({ nullable: true })
  group?: string;

  @Field(() => Float, { nullable: true })
  quality_score?: number;

  @Field({ nullable: true })
  url?: string;
}

@ObjectType()
export class ExpertRoutingResult {
  @Field(() => [ExpertMatch])
  experts: ExpertMatch[];

  @Field(() => Float)
  routing_confidence: number;

  @Field()
  routing_reason: string;

  @Field(() => Int)
  total_candidates_evaluated: number;
}

@ObjectType()
export class ExpertMatch {
  @Field()
  user_id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  full_name?: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field(() => Int)
  reputation_score: number;

  @Field(() => Float)
  match_score: number;

  @Field(() => [String])
  match_reasons: string[];

  @Field(() => Int, { nullable: true })
  expertise_level?: number;

  @Field({ nullable: true })
  group_name?: string;

  @Field()
  is_available: boolean;

  @Field(() => Float, { nullable: true })
  response_rate?: number;

  @Field(() => Float, { nullable: true })
  average_response_time_hours?: number;
}

@ObjectType()
export class SimilarContentResult {
  @Field(() => [SemanticSearchResult])
  similar_questions: SemanticSearchResult[];

  @Field(() => [SemanticSearchResult])
  similar_answers: SemanticSearchResult[];

  @Field(() => Float)
  max_similarity: number;

  @Field(() => Int)
  total_found: number;
}

@ObjectType()
export class EmbeddingResponse {
  @Field(() => [Float])
  embedding: number[];

  @Field(() => Int)
  dimensions: number;

  @Field()
  model: string;
}

@ObjectType()
export class AIStatsResponse {
  @Field(() => Int)
  total_answers_generated: number;

  @Field(() => Int)
  total_searches_performed: number;

  @Field(() => Int)
  total_expert_routings: number;

  @Field(() => Float)
  average_answer_confidence: number;

  @Field(() => Float)
  average_search_relevance: number;

  @Field(() => Int)
  tokens_consumed_today: number;

  @Field(() => Float)
  cost_today: number;
}