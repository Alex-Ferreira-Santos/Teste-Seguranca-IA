export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  is_active: boolean;
  activation_token?: string;
  failed_attempts: number;
  locked_until?: Date;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface SafeUser {
  id: number;
  email: string;
  name: string;
  created_at: Date;
  is_active: boolean;
}