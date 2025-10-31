import { UserType, JapaneseLevel } from "@prisma/client";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  userType: UserType;
  japaneseLevel?: JapaneseLevel;
  acceptsMarketing?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: UserType;
  japaneseLevel?: JapaneseLevel;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}
