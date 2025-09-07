import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersResolver, GroupsResolver, MembershipsResolver } from './users.resolver';
import { User } from './entities/user.entity';
import { Group } from './entities/group.entity';
import { UserGroupMembership } from './entities/user-group-membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, UserGroupMembership])],
  providers: [
    UsersService,
    UsersResolver,
    GroupsResolver,
    MembershipsResolver,
  ],
  controllers: [],
  exports: [
    TypeOrmModule,
    UsersService,
  ],
})
export class UsersModule {}