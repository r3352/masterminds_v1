import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Group } from '../../users/entities/group.entity';
import { Answer } from '../../answers/entities/answer.entity';
import { EscrowTransaction } from '../../payments/entities/escrow-transaction.entity';
import { Vote } from '../../common/entities/vote.entity';

@ObjectType()
@Entity('questions')
export class Question {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  content: string;

  @Column('float', { array: true, nullable: true })
  embedding: number[];

  @Column('float', { array: true, nullable: true })
  content_embedding: number[];

  @Field(() => User)
  @ManyToOne(() => User, user => user.questions)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  author_id: string;

  @Field(() => Group, { nullable: true })
  @ManyToOne(() => Group, group => group.questions, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Field(() => Group, { nullable: true })
  @ManyToOne(() => Group, group => group.questions, { nullable: true })
  @JoinColumn({ name: 'target_group_id' })
  target_group: Group;

  @Column({ nullable: true })
  group_id: string;

  @Column({ nullable: true })
  target_group_id: string;

  @Field(() => Int)
  @Column({ default: 0 })
  bounty_amount: number;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  priority_level: number;

  @Field()
  @Column({ default: false })
  is_urgent: boolean;

  @Field({ nullable: true })
  @Column({ nullable: true })
  sla_deadline: Date;

  @Field()
  @Column({ default: 'open' })
  status: string;

  @Field(() => Int)
  @Column({ default: 0 })
  view_count: number;

  @Field(() => Int)
  @Column({ default: 0 })
  upvotes: number;

  @Field(() => Int)
  @Column({ default: 0 })
  downvotes: number;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  @Field(() => Answer, { nullable: true })
  @ManyToOne(() => Answer, { nullable: true })
  @JoinColumn({ name: 'accepted_answer_id' })
  accepted_answer: Answer;

  @Column({ nullable: true })
  accepted_answer_id: string;

  @Field(() => [String])
  @Column('text', { array: true, default: [] })
  tags: string[];

  // Relations
  @Field(() => [Answer])
  @OneToMany(() => Answer, answer => answer.question)
  answers: Answer[];

  @OneToMany(() => EscrowTransaction, transaction => transaction.question)
  escrow_transactions: EscrowTransaction[];

  @OneToMany(() => Vote, vote => vote.question)
  votes: Vote[];
}