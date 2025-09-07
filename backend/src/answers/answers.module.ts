import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnswersService } from './answers.service';
import { AnswersResolver } from './answers.resolver';
import { Answer } from './entities/answer.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { Vote } from '../common/entities/vote.entity';
import { VoteResolver } from '../common/resolvers/vote.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Answer, Question, User, Vote])],
  providers: [
    AnswersService,
    AnswersResolver,
    VoteResolver,
  ],
  controllers: [],
  exports: [
    TypeOrmModule,
    AnswersService,
  ],
})
export class AnswersModule {}