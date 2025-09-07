import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { UserGroupMembership } from './entities/user-group-membership.entity';
import { CreateGroupDto, UpdateUserProfileDto, JoinGroupDto } from './dto/users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(UserGroupMembership)
    private membershipRepository: Repository<UserGroupMembership>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['group_memberships', 'group_memberships.group'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['group_memberships', 'group_memberships.group'],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: ['group_memberships', 'group_memberships.group'],
    });
  }

  async updateProfile(userId: string, updateData: UpdateUserProfileDto): Promise<User> {
    const user = await this.findById(userId);
    
    // Check if username is being changed and is available
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.findByUsername(updateData.username);
      if (existingUser) {
        throw new BadRequestException('Username already taken');
      }
    }

    Object.assign(user, updateData);
    return this.userRepository.save(user);
  }

  async updateReputation(userId: string, points: number, reason: string): Promise<User> {
    const user = await this.findById(userId);
    user.reputation_score += points;
    
    // Ensure reputation doesn't go below 0
    if (user.reputation_score < 0) {
      user.reputation_score = 0;
    }

    return this.userRepository.save(user);
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    return this.userRepository.find({
      where: [
        { username: Like(`%${query}%`) },
        { full_name: Like(`%${query}%`) },
        { email: Like(`%${query}%`) },
      ],
      take: limit,
      order: { reputation_score: 'DESC' },
    });
  }

  async getTopUsersByReputation(limit: number = 10): Promise<User[]> {
    return this.userRepository.find({
      take: limit,
      order: { reputation_score: 'DESC' },
      where: { is_active: true },
    });
  }

  async getUsersByIds(ids: string[]): Promise<User[]> {
    return this.userRepository.find({
      where: { id: In(ids) },
    });
  }

  // Group management
  async createGroup(createGroupDto: CreateGroupDto, creatorId: string): Promise<Group> {
    const creator = await this.findById(creatorId);
    
    const group = this.groupRepository.create({
      ...createGroupDto,
      member_count: 1,
      is_active: true,
    });

    const savedGroup = await this.groupRepository.save(group);

    // Add creator as first member with moderator privileges
    await this.joinGroup(creatorId, savedGroup.id, { expertise_level: 5 });
    await this.membershipRepository.update(
      { user: { id: creatorId }, group: { id: savedGroup.id } },
      { is_moderator: true }
    );

    return savedGroup;
  }

  async findAllGroups(isActive?: boolean): Promise<Group[]> {
    const where = isActive !== undefined ? { is_active: isActive } : {};
    return this.groupRepository.find({
      where,
      order: { member_count: 'DESC' },
    });
  }

  async findGroupById(id: string): Promise<Group> {
    const group = await this.groupRepository.findOne({
      where: { id },
      relations: ['memberships', 'memberships.user'],
    });

    if (!group) {
      throw new NotFoundException(`Group with ID ${id} not found`);
    }

    return group;
  }

  async searchGroups(query: string, limit: number = 20): Promise<Group[]> {
    return this.groupRepository.find({
      where: [
        { name: Like(`%${query}%`) },
        { description: Like(`%${query}%`) },
        { category: Like(`%${query}%`) },
      ],
      take: limit,
      order: { member_count: 'DESC' },
    });
  }

  async joinGroup(userId: string, groupId: string, joinData: JoinGroupDto): Promise<UserGroupMembership> {
    const user = await this.findById(userId);
    const group = await this.findGroupById(groupId);

    if (!group.is_active) {
      throw new BadRequestException('Cannot join inactive group');
    }

    // Check if user is already a member
    const existingMembership = await this.membershipRepository.findOne({
      where: { user: { id: userId }, group: { id: groupId } },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this group');
    }

    const membership = this.membershipRepository.create({
      user,
      group,
      expertise_level: joinData.expertise_level || 1,
      is_moderator: false,
    });

    const savedMembership = await this.membershipRepository.save(membership);

    // Update group member count
    await this.groupRepository.update(groupId, {
      member_count: group.member_count + 1,
    });

    return savedMembership;
  }

  async leaveGroup(userId: string, groupId: string): Promise<void> {
    const membership = await this.membershipRepository.findOne({
      where: { user: { id: userId }, group: { id: groupId } },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this group');
    }

    await this.membershipRepository.remove(membership);

    // Update group member count
    const group = await this.findGroupById(groupId);
    await this.groupRepository.update(groupId, {
      member_count: Math.max(0, group.member_count - 1),
    });
  }

  async updateGroupMembership(
    userId: string, 
    groupId: string, 
    updates: Partial<UserGroupMembership>
  ): Promise<UserGroupMembership> {
    const membership = await this.membershipRepository.findOne({
      where: { user: { id: userId }, group: { id: groupId } },
      relations: ['user', 'group'],
    });

    if (!membership) {
      throw new NotFoundException('Membership not found');
    }

    Object.assign(membership, updates);
    return this.membershipRepository.save(membership);
  }

  async getGroupMembers(groupId: string, limit: number = 50): Promise<UserGroupMembership[]> {
    return this.membershipRepository.find({
      where: { group: { id: groupId } },
      relations: ['user', 'group'],
      order: { expertise_level: 'DESC', joined_at: 'ASC' },
      take: limit,
    });
  }

  async getUserMemberships(userId: string): Promise<UserGroupMembership[]> {
    return this.membershipRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'group'],
      order: { joined_at: 'DESC' },
    });
  }

  async findExpertsByGroup(groupId: string, minExpertiseLevel: number = 3): Promise<User[]> {
    const memberships = await this.membershipRepository.find({
      where: { 
        group: { id: groupId },
        expertise_level: minExpertiseLevel >= minExpertiseLevel ? minExpertiseLevel : undefined,
      },
      relations: ['user'],
      order: { expertise_level: 'DESC' },
    });

    return memberships.map(membership => membership.user);
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.is_active = false;
    return this.userRepository.save(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.is_active = true;
    return this.userRepository.save(user);
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await this.findById(userId);
    
    // Remove user from all groups first
    const memberships = await this.getUserMemberships(userId);
    for (const membership of memberships) {
      await this.leaveGroup(userId, membership.group.id);
    }

    // Soft delete by deactivating
    await this.deactivateUser(userId);
  }

  async getUserStats(userId: string): Promise<any> {
    const user = await this.findById(userId);
    
    // These would typically use proper queries, simplified for now
    return {
      user,
      total_questions: user.questions?.length || 0,
      total_answers: user.answers?.length || 0,
      total_votes: user.votes?.length || 0,
      group_memberships: user.group_memberships?.length || 0,
      reputation_score: user.reputation_score,
    };
  }
}