import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionsService } from './questions.service';
import { QuestionsResolver } from './questions.resolver';
import { VoteResolver } from '../common/resolvers/vote.resolver';
import { Question } from './entities/question.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../users/entities/group.entity';
import { Vote } from '../common/entities/vote.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, User, Group, Vote])],
  providers: [
    QuestionsService,
    QuestionsResolver,
    VoteResolver,
  ],
  controllers: [],
  exports: [
    TypeOrmModule,
    QuestionsService,
  ],
})
export class QuestionsModule {}