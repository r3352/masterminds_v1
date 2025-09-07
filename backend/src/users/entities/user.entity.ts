import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Question } from '../../questions/entities/question.entity';
import { Answer } from '../../answers/entities/answer.entity';
import { ReputationEvent } from '../../reputation/entities/reputation-event.entity';
import { EscrowTransaction } from '../../payments/entities/escrow-transaction.entity';
import { UserGroupMembership } from './user-group-membership.entity';
import { Vote } from '../../common/entities/vote.entity';
import { Group } from './group.entity';

@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column({ unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  full_name: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  bio: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  avatar_url: string;

  @Column('float', { array: true, nullable: true })
  interests_embedding: number[];

  @Field(() => Int)
  @Column({ default: 0 })
  reputation_score: number;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  @Field()
  @Column({ default: true })
  is_active: boolean;

  @Field()
  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  stripe_customer_id: string;

  @Column({ nullable: true })
  stripe_connect_account_id: string;

  // Authentication fields
  @Column({ nullable: true })
  google_id: string;

  @Column({ nullable: true })
  two_factor_secret: string;

  @Column({ nullable: true })
  two_factor_secret_temp: string;

  @Field()
  @Column({ default: false })
  two_factor_enabled: boolean;

  @Column({ nullable: true })
  last_login: Date;

  @Column({ nullable: true })
  password_reset_token: string;

  @Column({ nullable: true })
  password_reset_expires: Date;

  // Relations
  @Field(() => [Question])
  @OneToMany(() => Question, question => question.author)
  questions: Question[];

  @Field(() => [Answer])
  @OneToMany(() => Answer, answer => answer.author)
  answers: Answer[];

  @OneToMany(() => ReputationEvent, event => event.user)
  reputation_events: ReputationEvent[];

  @OneToMany(() => EscrowTransaction, transaction => transaction.payer)
  payer_transactions: EscrowTransaction[];

  @OneToMany(() => EscrowTransaction, transaction => transaction.payee)
  payee_transactions: EscrowTransaction[];

  @OneToMany(() => UserGroupMembership, membership => membership.user)
  group_memberships: UserGroupMembership[];

  @OneToMany(() => Vote, vote => vote.user)
  votes: Vote[];

  @Field(() => [Group])
  @ManyToMany(() => Group, group => group.members)
  @JoinTable({
    name: 'user_group_memberships',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'group_id', referencedColumnName: 'id' },
  })
  groups: Group[];
}