import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';
import { Answer } from '../../answers/entities/answer.entity';

@ObjectType()
@Entity('votes')
export class Vote {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.votes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Field(() => Question, { nullable: true })
  @ManyToOne(() => Question, question => question.votes, { nullable: true })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ nullable: true })
  question_id: string;

  @Field(() => Answer, { nullable: true })
  @ManyToOne(() => Answer, answer => answer.votes, { nullable: true })
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;

  @Column({ nullable: true })
  answer_id: string;

  @Field()
  @Column()
  vote_type: string; // 'upvote' or 'downvote'

  @Field()
  @CreateDateColumn()
  created_at: Date;
}