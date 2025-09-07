import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class AnswerCountDto {
  @Field(() => Int)
  votes: number;
}