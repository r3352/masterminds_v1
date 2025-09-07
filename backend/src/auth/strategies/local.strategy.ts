import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'identifier', // Can be email or username
      passwordField: 'password',
    });
  }

  async validate(identifier: string, password: string): Promise<User> {
    try {
      const result = await this.authService.login({ identifier, password });
      // Extract user from the auth response
      return result.user as User;
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}