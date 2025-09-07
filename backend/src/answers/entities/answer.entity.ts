import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Question } from '../../questions/entities/question.entity';
import { Vote } from '../../common/entities/vote.entity';

@ObjectType()
@Entity('answers')
export class Answer {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Question)
  @ManyToOne(() => Question, question => question.answers)
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column()
  question_id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.answers)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  author_id: string;

  @Field()
  @Column('text')
  content: string;

  @Column('float', { array: true, nullable: true })
  content_embedding: number[];

  @Field(() => Int)
  @Column({ default: 0 })
  upvotes: number;

  @Field(() => Int)
  @Column({ default: 0 })
  downvotes: number;

  @Field(() => Float)
  @Column('decimal', { precision: 3, scale: 2, default: 0.0 })
  quality_score: number;

  @Field()
  @Column({ default: false })
  is_accepted: boolean;

  @Field()
  @Column({ default: false })
  is_ai_generated: boolean;

  @Field(() => Float, { nullable: true })
  @Column('decimal', { precision: 3, scale: 2, nullable: true })
  ai_confidence: number;

  @Field()
  @CreateDateColumn()
  created_at: Date;

  @Field()
  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @Field(() => [Vote])
  @OneToMany(() => Vote, vote => vote.answer)
  votes: Vote[];

  // Field resolvers for frontend compatibility (camelCase fields)
  @Field({ name: 'isAccepted' })
  get isAccepted(): boolean {
    return this.is_accepted;
  }

  @Field(() => Float, { name: 'qualityScore' })
  get qualityScore(): number {
    return this.quality_score;
  }

  @Field({ name: 'createdAt' })
  get createdAt(): Date {
    return this.created_at;
  }

  @Field({ name: 'updatedAt' })
  get updatedAt(): Date {
    return this.updated_at;
  }
}