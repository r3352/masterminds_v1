export interface LoginDto {
  email: string;
  password: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  requires2FA?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'USER' | 'EXPERT' | 'MODERATOR' | 'ADMIN';
  reputation: number;
  twoFactorEnabled: boolean;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}