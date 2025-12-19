export type UserRole = "learner" | "senior" | "student" | "admin";
export type JLPTLevel = "N1" | "N2" | "N3" | "N4" | "N5" | "beginner";
export type LearningGoal = "business" | "casual" | "both";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: UserRole;
  jlptLevel?: JLPTLevel;
  agreedToTerms: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  jlptLevel?: JLPTLevel;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
}
