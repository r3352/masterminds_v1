import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  EXPERT = 'expert',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);