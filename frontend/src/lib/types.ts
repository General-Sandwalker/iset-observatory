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
  preferences?: Record<string, unknown>;
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

// ─── Phase 4: AI & Analytical Intelligence types ─────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: Record<string, unknown>[];
  rowCount?: number;
  insights?: string;
}

export interface NLQueryResult {
  question: string;
  sql: string;
  data: Record<string, unknown>[];
  rowCount: number;
  explanation: string;
  insights: string;
}

export interface SurveyField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'email' | 'rating';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
}

export interface GeneratedSurvey {
  title: string;
  description: string;
  fields: SurveyField[];
  goal: string;
}

export interface SavedSurvey {
  id: number;
  title: string;
  description: string | null;
  goal: string | null;
  created_at: string;
}

export interface QueryableTable {
  id: number;
  name: string;
  table_name: string;
  row_count: number;
  column_mapping: ColumnMapping[];
}

// ─── Phase 5: Visual Dashboard Editor types ──────────────────────

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea';
export type AggregationType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

export interface ChartConfig {
  xColumn: string;
  yColumn: string;
  aggregation: AggregationType;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
}

export interface Chart {
  id: number;
  title: string;
  chart_type: ChartType;
  dataset_id: number;
  config: ChartConfig;
  dataset_name?: string;
  table_name?: string;
  column_mapping?: ColumnMapping[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardLayoutItem {
  chartId: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dashboard {
  id: number;
  title: string;
  description?: string;
  layout: DashboardLayoutItem[];
  created_by: number;
  created_at: string;
  updated_at: string;
}

// ─── Database Explorer ────────────────────────────────────────────

export interface TableColumn {
  column_name: string;
  data_type: string;
  udt_name: string;
}

export interface TablePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
