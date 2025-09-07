import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';

@ObjectType()
@Entity('escrow_transactions')
export class EscrowTransaction {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Question)
  @ManyToOne(() => Question, question => question.escrow_transactions)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  question_id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.payer_transactions)
  @JoinColumn({ name: 'payer_id' })
  payer: User;

  @Column()
  payer_id: string;

  @Field(() => User, { nullable: true })
  @ManyToOne(() => User, user => user.payee_transactions, { nullable: true })
  @JoinColumn({ name: 'payee_id' })
  payee: User;

  @Column({ nullable: true })
  payee_id: string;

  @Field(() => Int)
  @Column()
  amount: number;

  @Field(() => Int)
  @Column()
  platform_fee: number;

  @Field()
  @Column({ default: 'USD' })
  currency: string;

  @Column({ nullable: true })
  stripe_payment_intent_id: string;

  @Column({ nullable: true })
  stripe_transfer_id: string;

  @Field()
  @Column({ default: 'pending' })
  status: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  description: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  held_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  released_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  auto_release_at: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  release_reason: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  refunded_at: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  stripe_refund_id: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  refund_reason: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  disputed_at: Date;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  dispute_reason: string;
}