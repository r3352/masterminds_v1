import { ObjectType, Field } from '@nestjs/graphql';
import { Question } from '../../questions/entities/question.entity';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../users/entities/group.entity';
import { Answer } from '../../answers/entities/answer.entity';

@ObjectType()
export class SearchResultsDto {
  @Field(() => [Question], { nullable: true })
  questions?: Question[];

  @Field(() => [Answer], { nullable: true })
  answers?: Answer[];

  @Field(() => [User], { nullable: true })
  users?: User[];

  @Field(() => [Group], { nullable: true })
  groups?: Group[];
}