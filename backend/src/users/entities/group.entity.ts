import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { Question } from '../../questions/entities/question.entity';
import { UserGroupMembership } from './user-group-membership.entity';
import { SemanticRoute } from '../../ai/entities/semantic-route.entity';

@ObjectType()
@Entity('groups')
export class Group {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  description: string;

  @Field({ nullable: true })
  @Column({ nullable: true })
  category: string;

  @Column('float', { array: true, nullable: true })
  topic_embedding: number[];

  @Field(() => Int)
  @Column({ default: 0 })
  member_count: number;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @Column()
  created_by_id: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @Column({ default: false })
  is_private: boolean;

  @Field()
  @Column({ default: true })
  is_active: boolean;

  @Column('float', { array: true, nullable: true })
  embedding: number[];

  // Relations
  @Field(() => [Question])
  @OneToMany(() => Question, question => question.group)
  questions: Question[];

  @OneToMany(() => UserGroupMembership, membership => membership.group)
  memberships: UserGroupMembership[];

  @OneToMany(() => SemanticRoute, route => route.group)
  semantic_routes: SemanticRoute[];

  @Field(() => [User])
  @ManyToMany(() => User, user => user.groups)
  members: User[];
}