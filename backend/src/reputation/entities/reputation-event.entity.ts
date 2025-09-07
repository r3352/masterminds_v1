import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../users/entities/group.entity';
import { Question } from '../../questions/entities/question.entity';
import { Answer } from '../../answers/entities/answer.entity';

@ObjectType()
@Entity('reputation_events')
export class ReputationEvent {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.reputation_events)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Field(() => Group, { nullable: true })
  @ManyToOne(() => Group, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ nullable: true })
  group_id: string;

  @Field()
  @Column()
  event_type: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  description: string;

  @Field(() => Int)
  @Column()
  points_change: number;

  @Field(() => Float)
  @Column('decimal', { precision: 3, scale: 2, default: 1.0 })
  decay_factor: number;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field(() => Question, { nullable: true })
  @ManyToOne(() => Question, { nullable: true })
  @JoinColumn({ name: 'related_question_id' })
  related_question: Question;

  @Column({ nullable: true })
  related_question_id: string;

  @Field(() => Answer, { nullable: true })
  @ManyToOne(() => Answer, { nullable: true })
  @JoinColumn({ name: 'related_answer_id' })
  related_answer: Answer;

  @Column({ nullable: true })
  related_answer_id: string;
}