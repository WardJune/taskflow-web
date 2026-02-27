export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  data: {
    token: string;
    user: User;
  };
}
