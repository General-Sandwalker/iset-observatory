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

// ─── Phase 3: Ingestion Engine types ─────────────────────────────

export interface Dataset {
  id: number;
  name: string;
  file_name: string;
  table_name: string | null;
  status: 'uploaded' | 'processing' | 'imported' | 'error';
  row_count: number;
  column_mapping: ColumnMapping[] | null;
  uploaded_by: number;
  uploaded_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface ColumnMapping {
  originalHeader: string;
  columnName: string;
  columnType: 'TEXT' | 'INTEGER' | 'NUMERIC' | 'DATE' | 'BOOLEAN';
}

export interface ParsedPreview {
  dataset: Dataset;
  headers: string[];
  preview: Record<string, unknown>[];
  totalRows: number;
}
