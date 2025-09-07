import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsResolver } from './payments.resolver';
import { PaymentsController } from './payments.controller';
import { EscrowTransaction } from './entities/escrow-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { Answer } from '../answers/entities/answer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([EscrowTransaction, User, Question, Answer])],
  providers: [
    PaymentsService,
    PaymentsResolver,
  ],
  controllers: [PaymentsController],
  exports: [
    TypeOrmModule,
    PaymentsService,
  ],
})
export class PaymentsModule {}