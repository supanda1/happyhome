import { UserRole } from './common';
import { User } from './api';

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  device_id?: string;
  fcm_token?: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: UserRole;
  device_id?: string;
  fcm_token?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  password_confirmation: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface UpdateProfileRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  profile_image?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  tokens: AuthTokens | null;
  error: string | null;
}

export interface BiometricAuthConfig {
  enabled: boolean;
  type: 'fingerprint' | 'face' | 'both' | null;
  fallback_to_passcode: boolean;
}

export interface DeviceInfo {
  device_id: string;
  device_name: string;
  platform: string;
  version: string;
  app_version: string;
  fcm_token?: string;
}

export interface SessionInfo {
  device_info: DeviceInfo;
  login_time: string;
  last_activity: string;
  ip_address?: string;
  location?: string;
}