import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';
import {
  CreateUserDto,
  LoginDto,
  GoogleLoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  Verify2FADto,
  Disable2FADto,
  AuthResponse,
  Enable2FADto,
  MessageResponse,
  UserResponse,
} from './dto/auth.dto';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  async register(
    @Args('input', ValidationPipe) createUserDto: CreateUserDto,
  ): Promise<AuthResponse> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async login(
    @Args('input', ValidationPipe) loginDto: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async googleLogin(
    @Args('input', ValidationPipe) googleLoginDto: GoogleLoginDto,
  ): Promise<AuthResponse> {
    return this.authService.googleLogin(googleLoginDto.token);
  }

  @Public()
  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('input', ValidationPipe) refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshTokenDto.refresh_token);
  }

  @UseGuards(JwtAuthGuard)
  @Query(() => UserResponse)
  async me(@CurrentUser() user: User): Promise<UserResponse> {
    const { password_hash, two_factor_secret, two_factor_secret_temp, ...sanitized } = user;
    return sanitized as UserResponse;
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async changePassword(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) changePasswordDto: ChangePasswordDto,
  ): Promise<MessageResponse> {
    await this.authService.changePassword(user.id, changePasswordDto);
    return {
      message: 'Password changed successfully',
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => Enable2FADto)
  async enable2FA(@CurrentUser() user: User): Promise<Enable2FADto> {
    return this.authService.enable2FA(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async verify2FA(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) verify2FADto: Verify2FADto,
  ): Promise<MessageResponse> {
    await this.authService.verify2FA(user.id, verify2FADto);
    return {
      message: '2FA enabled successfully',
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async disable2FA(
    @CurrentUser() user: User,
    @Args('input', ValidationPipe) disable2FADto: Disable2FADto,
  ): Promise<MessageResponse> {
    await this.authService.disable2FA(user.id, disable2FADto.totp_code);
    return {
      message: '2FA disabled successfully',
      success: true,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Mutation(() => MessageResponse)
  async logout(): Promise<MessageResponse> {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just return a success message
    // The client should remove the token from storage
    return {
      message: 'Logged out successfully',
      success: true,
    };
  }
}