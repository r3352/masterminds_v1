import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

@InputType()
export class CreateAnswerDto {
  @Field()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  content: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  question_id: string;
}

@InputType()
export class UpdateAnswerDto {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(10000)
  content?: string;
}