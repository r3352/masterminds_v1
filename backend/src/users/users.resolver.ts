import { Resolver, Query, Mutation, Args, ResolveField, Parent, Int } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles, Role } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { UserGroupMembership } from './entities/user-group-membership.entity';
import {
  UpdateUserProfileDto,
  CreateGroupDto,
  UpdateGroupDto,
  JoinGroupDto,
  SearchUsersDto,
  SearchGroupsDto,
  UserStatsResponse,
  GroupMemberResponse,
  UserMembershipResponse,
} from './dto/users.dto';
import { MessageResponse } from '../auth/dto/auth.dto';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  // User Queries
  @Public()
  @Query(() => User)
  async user(@Args('id') id: string): Promise<User> {
    return this.usersService.findById(id);
  }

  @Public()
  @Query(() => User, { nullable: true })
  async userByUsername(@Args('username') username: string): Promise<User | null> {
    return this.usersService.findByUsername(username);
  }

  @Public()
  @Query(() => [User])
  async searchUsers(@Args('input', ValidationPipe) searchDto: SearchUsersDto): Promise<User[]> {
    return this.usersService.searchUsers(searchDto.query, searchDto.limit);
  }

  @Public()
  @Query(() => [User])
  async topUsers(@Args('limit', { type: () => Int, nullable: true }) limit?: number): Promise<User[]> {
    return this.usersService.getTopUsersByReputation(limit);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserStatsResponse)
  async userStats(@Args('userId', { nullable: true }) userId?: string, @CurrentUser() currentUser?: User): Promise<UserStatsResponse> {
    const targetUserId = userId || currentUser.id;
    const stats = await this.usersService.getUserStats(targetUserId);
    
    return {
      total_questions: stats.total_questions,
      total_answers: stats.total_answers,
      total_votes: stats.total_votes,
      group_memberships: stats.group_memberships,
      reputation_score: stats.reputation_score,
      member_since: stats.user.created_at,
    };
  }

  // User Mutations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => User)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) updateData: UpdateUserProfileDto,
  ): Promise<User> {
    return this.usersService.updateProfile(user.id, updateData);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => User)
  async updateUserReputation(
    @Args('userId') userId: string,
    @Args('points') points: number,
    @Args('reason') reason: string,
  ): Promise<User> {
    return this.usersService.updateReputation(userId, points, reason);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => MessageResponse)
  async deactivateUser(@Args('userId') userId: string): Promise<MessageResponse> {
    await this.usersService.deactivateUser(userId);
    return { message: 'User deactivated successfully', success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Mutation(() => MessageResponse)
  async activateUser(@Args('userId') userId: string): Promise<MessageResponse> {
    await this.usersService.activateUser(userId);
    return { message: 'User activated successfully', success: true };
  }

  // User Field Resolvers
  @ResolveField(() => [UserGroupMembership])
  async memberships(@Parent() user: User): Promise<UserGroupMembership[]> {
    return this.usersService.getUserMemberships(user.id);
  }

  // Field resolvers for frontend compatibility (camelCase fields)
  @ResolveField(() => String, { name: 'name' })
  async name(@Parent() user: User): Promise<string> {
    return user.full_name || user.username;
  }

  @ResolveField(() => Number, { name: 'reputation' })
  async reputation(@Parent() user: User): Promise<number> {
    return user.reputation_score;
  }

  @ResolveField(() => String, { name: 'avatar', nullable: true })
  async avatar(@Parent() user: User): Promise<string | null> {
    return user.avatar_url || null;
  }

  @ResolveField(() => String, { name: 'role' })
  async role(@Parent() user: User): Promise<string> {
    // This is a simple role determination - in a real app you'd have proper role management
    if (user.reputation_score >= 1000) return 'expert';
    if (user.reputation_score >= 500) return 'contributor';
    return 'member';
  }
}

@Resolver(() => Group)
export class GroupsResolver {
  constructor(private usersService: UsersService) {}

  // Group Queries
  @Public()
  @Query(() => [Group])
  async groups(@Args('active', { nullable: true }) active?: boolean): Promise<Group[]> {
    return this.usersService.findAllGroups(active);
  }

  @Public()
  @Query(() => Group)
  async group(@Args('id') id: string): Promise<Group> {
    return this.usersService.findGroupById(id);
  }

  @Public()
  @Query(() => [Group])
  async searchGroups(@Args('input', ValidationPipe) searchDto: SearchGroupsDto): Promise<Group[]> {
    return this.usersService.searchGroups(searchDto.query, searchDto.limit);
  }

  @Public()
  @Query(() => [GroupMemberResponse])
  async groupMembers(
    @Args('groupId') groupId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<GroupMemberResponse[]> {
    const memberships = await this.usersService.getGroupMembers(groupId, limit);
    
    return memberships.map(membership => ({
      id: membership.user.id,
      username: membership.user.username,
      full_name: membership.user.full_name,
      avatar_url: membership.user.avatar_url,
      reputation_score: membership.user.reputation_score,
      expertise_level: membership.expertise_level,
      is_moderator: membership.is_moderator,
      joined_at: membership.joined_at,
    }));
  }

  @Public()
  @Query(() => [User])
  async groupExperts(
    @Args('groupId') groupId: string,
    @Args('minExpertiseLevel', { nullable: true }) minExpertiseLevel?: number,
  ): Promise<User[]> {
    return this.usersService.findExpertsByGroup(groupId, minExpertiseLevel);
  }

  // Group Mutations
  @UseGuards(JwtAuthGuard)
  @Mutation(() => Group)
  async createGroup(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) createGroupDto: CreateGroupDto,
  ): Promise<Group> {
    return this.usersService.createGroup(createGroupDto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR, Role.ADMIN)
  @Mutation(() => Group)
  async updateGroup(
    @Args('groupId') groupId: string,
    @Args('input', ValidationPipe) updateData: UpdateGroupDto,
  ): Promise<Group> {
    // This would need additional logic to check if user is moderator of this specific group
    const group = await this.usersService.findGroupById(groupId);
    Object.assign(group, updateData);
    // Note: This is simplified - in a real implementation, you'd use a proper update method
    return group;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => UserGroupMembership)
  async joinGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
    @Args('input', ValidationPipe) joinData: JoinGroupDto,
  ): Promise<UserGroupMembership> {
    return this.usersService.joinGroup(user.id, groupId, joinData);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async leaveGroup(
    @CurrentUser() user: User,
    @Args('groupId') groupId: string,
  ): Promise<MessageResponse> {
    await this.usersService.leaveGroup(user.id, groupId);
    return { message: 'Left group successfully', success: true };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.MODERATOR, Role.ADMIN)
  @Mutation(() => UserGroupMembership)
  async updateMembership(
    @Args('userId') userId: string,
    @Args('groupId') groupId: string,
    @Args('expertiseLevel', { nullable: true }) expertiseLevel?: number,
    @Args('isModerator', { nullable: true }) isModerator?: boolean,
  ): Promise<UserGroupMembership> {
    const updates: Partial<UserGroupMembership> = {};
    
    if (expertiseLevel !== undefined) {
      updates.expertise_level = expertiseLevel;
    }
    
    if (isModerator !== undefined) {
      updates.is_moderator = isModerator;
    }
    
    return this.usersService.updateGroupMembership(userId, groupId, updates);
  }


  // Group Field Resolvers
  @ResolveField(() => [UserGroupMembership])
  async members(@Parent() group: Group): Promise<UserGroupMembership[]> {
    return this.usersService.getGroupMembers(group.id);
  }

  @ResolveField(() => [User])
  async experts(@Parent() group: Group): Promise<User[]> {
    return this.usersService.findExpertsByGroup(group.id, 3);
  }
}

@Resolver(() => UserGroupMembership)
export class MembershipsResolver {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Query(() => [UserMembershipResponse])
  async myMemberships(@CurrentUser() user: User): Promise<UserMembershipResponse[]> {
    const memberships = await this.usersService.getUserMemberships(user.id);
    
    return memberships.map(membership => ({
      group_id: membership.group.id,
      group_name: membership.group.name,
      group_description: membership.group.description,
      expertise_level: membership.expertise_level,
      is_moderator: membership.is_moderator,
      joined_at: membership.joined_at,
    }));
  }
}