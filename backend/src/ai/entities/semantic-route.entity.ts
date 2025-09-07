import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { Group } from '../../users/entities/group.entity';
import { Question } from '../../questions/entities/question.entity';

@ObjectType()
@Entity('semantic_routes')
export class SemanticRoute {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  route_name: string;

  @Field(() => Group, { nullable: true })
  @ManyToOne(() => Group, group => group.semantic_routes, { nullable: true })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column({ nullable: true })
  group_id: string;

  @Field(() => Question, { nullable: true })
  @ManyToOne(() => Question, { nullable: true })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ nullable: true })
  question_id: string;

  @Field(() => [String])
  @Column('text', { array: true, default: [] })
  keywords: string[];

  @Column('float', { array: true, nullable: true })
  embedding: number[];

  @Column('float', { array: true, nullable: true })
  query_embedding: number[];

  @Field(() => [String], { nullable: true })
  @Column('text', { array: true, nullable: true, default: [] })
  expert_ids: string[];

  @Field(() => Float)
  @Column('decimal', { precision: 3, scale: 2, default: 0.8 })
  confidence_threshold: number;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  confidence_score: number;

  @Field({ nullable: true })
  @Column('text', { nullable: true })
  route_reason: string;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @Column({ default: true })
  is_active: boolean;
}