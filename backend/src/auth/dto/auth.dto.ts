import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsNotEmpty } from 'class-validator';
import { InputType, Field, ObjectType } from '@nestjs/graphql';

@InputType()
export class CreateUserDto {
  @Field()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Field()
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
  username: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  full_name?: string;
}

@InputType()
export class LoginDto {
  @Field()
  @IsNotEmpty({ message: 'Email or username is required' })
  identifier: string; // email or username

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: '2FA code must be 6 digits' })
  totp_code?: string;
}

@InputType()
export class GoogleLoginDto {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Google token is required' })
  token: string;
}

@InputType()
export class RefreshTokenDto {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Refresh token is required' })
  refresh_token: string;
}

@InputType()
export class ChangePasswordDto {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  current_password: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  new_password: string;
}

@InputType()
export class Verify2FADto {
  @Field()
  @IsString()
  @Matches(/^\d{6}$/, { message: '2FA code must be 6 digits' })
  totp_code: string;
}

@InputType()
export class Disable2FADto {
  @Field()
  @IsString()
  @Matches(/^\d{6}$/, { message: '2FA code must be 6 digits' })
  totp_code: string;
}

@InputType()
export class ForgotPasswordDto {
  @Field()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;
}

@InputType()
export class ResetPasswordDto {
  @Field()
  @IsString()
  @IsNotEmpty({ message: 'Reset token is required' })
  token: string;

  @Field()
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  new_password: string;
}

// Response DTOs
@ObjectType()
export class UserResponse {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  full_name?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  avatar_url?: string;

  @Field()
  reputation_score: number;

  @Field()
  is_active: boolean;

  @Field()
  email_verified: boolean;

  @Field()
  created_at: Date;

  @Field()
  updated_at: Date;

  @Field({ nullable: true })
  two_factor_enabled?: boolean;
}

@ObjectType()
export class AuthResponse {
  @Field()
  access_token: string;

  @Field()
  refresh_token: string;

  @Field()
  expires_in: number;

  @Field(() => UserResponse)
  user: UserResponse;
}

@ObjectType()
export class Enable2FADto {
  @Field()
  secret: string;

  @Field()
  qr_code_url: string;

  @Field(() => [String])
  backup_codes: string[];
}

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;

  @Field({ defaultValue: true })
  success: boolean;
}