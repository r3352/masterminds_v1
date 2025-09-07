import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { User } from './user.entity';
import { Group } from './group.entity';

@ObjectType()
@Entity('user_group_memberships')
export class UserGroupMembership {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.group_memberships)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @Field(() => Group)
  @ManyToOne(() => Group, group => group.memberships)
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @Column()
  group_id: string;

  @Field()
  @Column({ default: 'member' })
  role: string;

  @Field(() => Int)
  @Column({ default: 1 })
  expertise_level: number;

  @Field()
  @Column({ default: false })
  is_moderator: boolean;

  @Field()
  @CreateDateColumn()
  joined_at: Date;

  @Field()
  @Column({ default: true })
  is_active: boolean;
}