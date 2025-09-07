import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiService } from './ai.service';
import { AiResolver } from './ai.resolver';
import { SemanticRoute } from './entities/semantic-route.entity';
import { Question } from '../questions/entities/question.entity';
import { Answer } from '../answers/entities/answer.entity';
import { User } from '../users/entities/user.entity';
import { Group } from '../users/entities/group.entity';
import { UserGroupMembership } from '../users/entities/user-group-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    SemanticRoute,
    Question,
    Answer,
    User,
    Group,
    UserGroupMembership,
  ])],
  providers: [
    AiService,
    AiResolver,
  ],
  controllers: [],
  exports: [
    TypeOrmModule,
    AiService,
  ],
})
export class AiModule {}