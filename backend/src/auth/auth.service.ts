import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/entities/user.entity';
import { CreateUserDto, LoginDto, ChangePasswordDto, Enable2FADto, Verify2FADto, AuthResponse, UserResponse } from './dto/auth.dto';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}


@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;
  private readonly saltRounds = 12;

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const { email, username, password, full_name } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    // Validate password strength
    this.validatePasswordStrength(password);

    // Hash password
    const password_hash = await bcrypt.hash(password, this.saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      username,
      password_hash,
      full_name,
      is_active: true,
      email_verified: false,
      reputation_score: 0,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(savedUser);

    return {
      ...tokens,
      user: this.sanitizeUser(savedUser),
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { identifier, password, totp_code } = loginDto;

    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [
        { email: identifier },
        { username: identifier },
      ],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.is_active) {
      throw new UnauthorizedException('Account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check 2FA if enabled
    if (user.two_factor_secret) {
      if (!totp_code) {
        throw new UnauthorizedException('2FA code required');
      }

      const isValidTOTP = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: totp_code,
        window: 1,
      });

      if (!isValidTOTP) {
        throw new UnauthorizedException('Invalid 2FA code');
      }
    }

    // Update last login
    await this.userRepository.update(user.id, {
      last_login: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      ...tokens,
      user: this.sanitizeUser(user),
    };
  }

  async googleLogin(token: string): Promise<AuthResponse> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { email, name, picture, sub: googleId } = payload;

      // Find or create user
      let user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        // Create new user from Google profile
        user = this.userRepository.create({
          email,
          username: email.split('@')[0] + Math.random().toString(36).substr(2, 4),
          full_name: name,
          avatar_url: picture,
          password_hash: await bcrypt.hash(Math.random().toString(36), this.saltRounds), // Random password
          is_active: true,
          email_verified: true, // Google emails are verified
          google_id: googleId,
          reputation_score: 0,
        });

        user = await this.userRepository.save(user);
      } else if (!user.google_id) {
        // Link existing account to Google
        await this.userRepository.update(user.id, {
          google_id: googleId,
          email_verified: true,
        });
      }

      // Update last login
      await this.userRepository.update(user.id, {
        last_login: new Date(),
      });

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user || !user.is_active) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = await this.generateTokens(user);

      return {
        ...tokens,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { current_password, new_password } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(new_password);

    // Hash new password
    const new_password_hash = await bcrypt.hash(new_password, this.saltRounds);

    // Update password
    await this.userRepository.update(userId, {
      password_hash: new_password_hash,
      updated_at: new Date(),
    });
  }

  async enable2FA(userId: string): Promise<Enable2FADto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.two_factor_secret) {
      throw new BadRequestException('2FA is already enabled');
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Masterminds (${user.email})`,
      issuer: 'Masterminds Q&A Platform',
    });

    // Save secret temporarily (will be confirmed when user verifies)
    await this.userRepository.update(userId, {
      two_factor_secret_temp: secret.base32,
    });

    return {
      secret: secret.base32,
      qr_code_url: secret.otpauth_url,
      backup_codes: this.generateBackupCodes(),
    };
  }

  async verify2FA(userId: string, verify2FADto: Verify2FADto): Promise<void> {
    const { totp_code } = verify2FADto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.two_factor_secret_temp) {
      throw new BadRequestException('No 2FA setup in progress');
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret_temp,
      encoding: 'base32',
      token: totp_code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Enable 2FA
    await this.userRepository.update(userId, {
      two_factor_secret: user.two_factor_secret_temp,
      two_factor_secret_temp: null,
      two_factor_enabled: true,
    });
  }

  async disable2FA(userId: string, totp_code: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.two_factor_secret) {
      throw new BadRequestException('2FA is not enabled');
    }

    // Verify TOTP code
    const isValid = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: totp_code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid 2FA code');
    }

    // Disable 2FA
    await this.userRepository.update(userId, {
      two_factor_secret: null,
      two_factor_enabled: false,
    });
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (user && user.is_active) {
      return user;
    }

    return null;
  }

  private async generateTokens(user: User): Promise<Omit<AuthResponse, 'user'>> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 15 * 60, // 15 minutes in seconds
    };
  }

  private sanitizeUser(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      full_name: user.full_name,
      bio: user.bio,
      avatar_url: user.avatar_url,
      reputation_score: user.reputation_score,
      is_active: user.is_active,
      email_verified: user.email_verified,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  private validatePasswordStrength(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    if (!/(?=.*\d)/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (@$!%*?&)');
    }
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(Math.random().toString(36).substr(2, 8).toUpperCase());
    }
    return codes;
  }
}