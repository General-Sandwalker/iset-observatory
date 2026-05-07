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
  userType?: 'staff' | 'client';
  cin?: string;
  username?: string;
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

export type ChartType = 'bar' | 'horizontalBar' | 'line' | 'pie' | 'doughnut' | 'radar' | 'polarArea' | 'scatter' | 'bubble' | 'area';
export type AggregationType = 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX';

export interface ChartConfig {
  xColumn?: string;
  yColumn?: string;
  aggregation?: AggregationType;
  sql?: string;
  labelCol?: string;
  valueCol?: string;
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  tension?: number;
  fill?: boolean;
  borderWidth?: number;
  pointRadius?: number;
  colorScheme?: string;
  maxDataPoints?: number;
}

export interface Chart {
  id: number;
  title: string;
  chart_type: ChartType;
  dataset_id?: number | null;
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
  is_public?: boolean;
  created_by: number;
  created_by_name?: string;
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

// ─── Additional types ─────────────────────────────────────────────

export interface ForeignLink {
  id: number;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  created_by: number;
  created_at: string;
}

export interface SavedQuery {
  id: number;
  title: string;
  sql: string;
  description?: string;
  is_public: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export interface DataProfile {
  column_name: string;
  data_type: string;
  null_count: number;
  unique_count: number;
  min_value?: string | number;
  max_value?: string | number;
  avg_value?: number;
  sample_values: string[];
}

export interface ActivityLogEntry {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: number;
  details?: string;
  created_at: string;
}

export interface ChartColorScheme {
  name: string;
  colors: string[];
}

export interface ChartAdvancedConfig {
  showLegend?: boolean;
  showGrid?: boolean;
  showValues?: boolean;
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  fill?: boolean;
  tension?: number;
  borderWidth?: number;
  pointRadius?: number;
  animation?: boolean;
  maxDataPoints?: number;
  colorScheme?: string;
}

export interface Client {
  id: number;
  cin: string;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  client_type: 'student' | 'alumni' | 'teacher';
  is_active: boolean;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: number;
  title: string;
  content: string;
  report_type: string;
  client_id?: number | null;
  dataset_id?: number | null;
  is_public: boolean;
  created_by?: number;
  created_by_name?: string;
  client_name?: string;
  client_cin?: string;
  created_at: string;
  updated_at: string;
}
