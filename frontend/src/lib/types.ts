export interface User {
  id: number;
  email: string;
  fullName: string;
  full_name?: string;
  role: string;
  legacy_role?: string;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  is_system?: boolean;
  created_at?: string;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  category: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
