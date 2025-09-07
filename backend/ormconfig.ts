import { DataSource } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { Group } from './src/users/entities/group.entity';
import { UserGroupMembership } from './src/users/entities/user-group-membership.entity';
import { Question } from './src/questions/entities/question.entity';
import { Answer } from './src/answers/entities/answer.entity';
import { Vote } from './src/common/entities/vote.entity';
import { ReputationEvent } from './src/reputation/entities/reputation-event.entity';
import { EscrowTransaction } from './src/payments/entities/escrow-transaction.entity';
import { SemanticRoute } from './src/ai/entities/semantic-route.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/masterminds',
  entities: [
    User,
    Group,
    UserGroupMembership,
    Question,
    Answer,
    Vote,
    ReputationEvent,
    EscrowTransaction,
    SemanticRoute,
  ],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
  synchronize: false, // Use migrations in production
  logging: process.env.NODE_ENV === 'development',
});