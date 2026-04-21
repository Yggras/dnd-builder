export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthStatus {
  isAuthenticated: boolean;
  isLoading: boolean;
}
