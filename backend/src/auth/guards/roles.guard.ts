import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ROLES_KEY, Role } from '../decorators/roles.decorator';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check if user has admin role (stored in user entity or derived from groups)
    const userRoles = this.getUserRoles(user);
    
    const hasRole = requiredRoles.some((role) => userRoles.includes(role));
    
    if (!hasRole) {
      throw new ForbiddenException(`Insufficient privileges. Required roles: ${requiredRoles.join(', ')}`);
    }
    
    return true;
  }

  private getUserRoles(user: User): Role[] {
    const roles: Role[] = [Role.USER]; // Everyone is at least a user

    // Check if user is admin (you can implement your own logic)
    if (user.email.endsWith('@masterminds.com')) {
      roles.push(Role.ADMIN);
    }

    // Check if user is moderator based on group memberships
    if (user.group_memberships?.some(membership => membership.is_moderator)) {
      roles.push(Role.MODERATOR);
    }

    // Check if user is expert based on reputation
    if (user.reputation_score >= 1000) {
      roles.push(Role.EXPERT);
    }

    return roles;
  }
}