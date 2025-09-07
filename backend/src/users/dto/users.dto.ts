import { InputType, Field, ObjectType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength, MinLength, IsNumber, Min, Max, IsBoolean } from 'class-validator';

@InputType()
export class UpdateUserProfileDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  full_name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}

@InputType()
export class UpdateSettingsDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  push_notifications?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  privacy_public_profile?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  privacy_show_email?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  preferred_language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;
}

@InputType()
export class CreateGroupDto {
  @Field()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name: string;

  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description: string;

  @Field()
  @IsString()
  @MaxLength(50)
  category: string;
}

@InputType()
export class UpdateGroupDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

@InputType()
export class JoinGroupDto {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  expertise_level?: number;
}

@InputType()
export class SearchUsersDto {
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

@InputType()
export class SearchGroupsDto {
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
export class UserStatsResponse {
  @Field(() => Int)
  total_questions: number;

  @Field(() => Int)
  total_answers: number;

  @Field(() => Int)
  total_votes: number;

  @Field(() => Int)
  group_memberships: number;

  @Field(() => Int)
  reputation_score: number;

  @Field()
  member_since: Date;
}

@ObjectType()
export class GroupMemberResponse {
  @Field()
  id: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  full_name?: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field(() => Int)
  reputation_score: number;

  @Field(() => Int)
  expertise_level: number;

  @Field()
  is_moderator: boolean;

  @Field()
  joined_at: Date;
}

@ObjectType()
export class UserMembershipResponse {
  @Field()
  group_id: string;

  @Field()
  group_name: string;

  @Field()
  group_description: string;

  @Field(() => Int)
  expertise_level: number;

  @Field()
  is_moderator: boolean;

  @Field()
  joined_at: Date;
}