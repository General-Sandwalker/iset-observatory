# ISET Observatory — Full Remake Progress Tracker

## Phase 1: Foundation & Core Fixes ✅
- [x] Replace Tailwind CSS + Aerogel design system with Ant Design
- [x] Install antd, @ant-design/icons, dayjs; remove tailwindcss, lucide-react
- [x] Rewrite all 14 pages and 3 components in Ant Design
- [x] Fix build errors (ActivityOutlined→ThunderboltOutlined, alert()→message.error())
- [x] Fix Docker deployment (backend Dockerfile, volume mounts)
- [x] Vite build passes, all containers running

## Phase 2: UI/UX Overhaul ✅
- [x] Fix /ai page — complete rewrite with modern chat UI, suggested questions, collapsible SQL/data/chart
- [x] Full Ant Design theming with 5 color schemes (ocean, forest, sunset, lavender, crimson)
- [x] Theme selector in Settings page with visual color swatches
- [x] Light/dark mode toggle with full token customization
- [x] Responsive/adaptive layout for all screen sizes (Grid.useBreakpoint, Row/Col with xs/sm/md/lg/xl)
- [x] Fix Sidebar — removed nested Sider bug, permission-based menu filtering, sub-route highlighting, mobile support
- [x] Sticky header bar with page title, notification bell, user avatar
- [x] Redesign Dashboard — rich stats, quick actions, AI insights, popular charts, recent activity
- [x] User avatars with gradient initials throughout the app
- [x] Split-screen login page with branded left panel
- [x] Branded loading screen in ProtectedRoute

## Phase 3: Chart & Data Power-Up ✅
- [x] 10 chart types: bar, horizontalBar, line, pie, doughnut, radar, polarArea, scatter, bubble, area
- [x] Advanced configuration: legend, grid, values, tension, fill, border width, point radius, color palettes, max points
- [x] 8 color palettes (ocean, forest, sunset, lavender, pastel, vibrant, earth, mono)
- [x] Client-side aggregation (no more creating charts just to preview)
- [x] Live preview panel side-by-side with builder
- [x] Export PNG and JSON
- [x] Duplicate chart feature
- [x] Dashboard Canvas: responsive grid, auto-refresh, inline editable title, chart picker modal

## Phase 4: Relational Data & AI Automation ✅
- [x] Foreign key linking between tables (backend + frontend)
- [x] ER diagram visualization on FK manager page (SVG-based)
- [x] AI Suggest Relations button
- [x] Saved SQL queries with CRUD and execute
- [x] AI Query Builder in Saved Queries page
- [x] Data profiling endpoint (null count, unique count, min, max, avg, samples)
- [x] Profile tab in Table Editor
- [x] Relations tab in Table Editor

## Phase 5: New Features ✅
- [x] Notification system (backend + frontend with bell icon, Popover, mark read/all read)
- [x] NotificationContext with auto-refresh every 60s
- [x] Data export (CSV and JSON from Table Editor)
- [x] Saved surveys management (no longer hidden with display:none)
- [x] Survey field editor (add, remove, reorder, edit)
- [x] Schema editor in Table Editor
- [x] Import from URL (DataImport page)
- [x] Activity log placeholder in Dashboard
- [x] Stats bar on Landing page
- [x] Testimonials section on Landing page
- [x] API documentation in Docs page
- [x] Quick Start guide in Docs page
- [x] Mobile hamburger menu in AppLayout
- [x] Permission matrix in Roles page
- [x] Role comparison feature
- [x] Bulk user actions (activate/deactivate)
- [x] Debounced search on Users page
- [x] Responsive card/table switch on Users page
- [x] Step-by-step mapping workspace in Data Import

## Phase 6: Documentation ✅
- [x] PROGRESS.md with full feature tracking
- [x] Architecture overview diagram (ASCII)
- [x] Data flow diagram for AI queries
- [x] Component architecture diagram
- [x] API endpoint reference in Docs page

## Phase 7: Bug Fixes & Security ✅
- [x] Fix RolesPage crash on Collapse expand — added missing `CloseCircleOutlined` import (line 260 referenced it but it wasn't imported)
- [x] Fix Role comparison tool — replaced raw `<select>` HTML with Ant Design `<Select>` components for consistent styling
- [x] Fix Role comparison state timing — selector modal now only shows when `compareLeft == null`, preventing the compare results modal from being hidden by the selector's `onClose()` call
- [x] Fix `updateUser()` in AuthContext — now persists updated user data to `localStorage` so page refreshes don't show stale data
- [x] Add role-based route protection — new `RoleRoute` component wraps admin routes (`/users`, `/roles`) and shows 403 page for unauthorized users

## Phase 8: Client System & AI Reports ✅

### Backend
- [x] Migration 012: `clients` table (cin, username, full_name, email, phone, client_type, password_hash, is_active, created_by)
- [x] Migration 012: New roles (student, alumni, teacher) + 8 new permissions (clients.view/create/edit/delete/import, reports.generate/view, dashboards.publish)
- [x] Migration 012: `user_type` column on users table (default 'staff')
- [x] Migration 012: Role-permission mappings for super_admin, admin, teacher
- [x] Migration 013: `is_public` column on dashboards table
- [x] Migration 013: `reports` table (title, content, report_type, client_id, dataset_id, is_public, created_by)
- [x] Clients controller: Full CRUD + `bulkImportClients` (CSV column mapping, configurable password column, CIN as default, row-by-row with error collection)
- [x] Reports controller: listReports, getReport, generateReportHandler (AI-generated performance reports), updateReport (title/content/isPublic), deleteReport, listPublicReports
- [x] Auth controller: `clientLogin` function (username+password auth against clients table, returns JWT with userType:'client', cin, username)
- [x] Auth controller: `getMe` updated to check JWT userType — queries `clients` table for client tokens, `users` table for staff tokens
- [x] Auth controller: `updateMe`, `changePassword`, `updatePreferences` updated to handle client tokens (query correct table)
- [x] Auth routes: `POST /api/auth/client-login` (public)
- [x] Staff login JWT now includes `userType: 'staff'` for consistency
- [x] AI service: `suggestForeignKeys()` (dedicated FK suggestion endpoint, structured JSON output, confidence levels)
- [x] AI service: `generateReport()` (academic performance report generation in markdown)
- [x] FK controller: `aiSuggestForeignKeys` endpoint + type checking in `createForeignKey` (rejects numeric↔text mismatches)
- [x] FK routes: `POST /api/foreign-keys/ai-suggest` endpoint
- [x] Dashboards controller: `updateDashboard` supports `isPublic` field
- [x] Middleware: `JwtPayload` interface updated with `userType`, `username` fields
- [x] Middleware: `requirePermission` blocks client users (no RBAC mapping) with clear error
- [x] Server: 4 public API endpoints (GET /api/public/dashboards, /public/dashboards/:id, /public/reports, /public/reports/:id)
- [x] Server: 2 client-specific endpoints (GET /api/client/reports, /api/client/reports/:id) — returns client's own + public reports

### Frontend
- [x] ForeignKeyManagerPage: Updated `handleAiSuggest` to use `/foreign-keys/ai-suggest` endpoint (structured response)
- [x] ForeignKeyManagerPage: Added type compatibility warnings in Column Link Modal (numeric↔text mismatch warning, different types info)
- [x] ClientsPage: Full CRUD table with avatar initials, client type color tags, search, stats cards
- [x] ClientsPage: CSV Bulk Import wizard with 3 steps (Upload CSV → Map Columns with auto-detect + configurable password column → Result with created/skipped/errors)
- [x] ClientsPage: Template CSV download
- [x] ReportsPage: Reports table with type tags, public/private status, AI generate modal (title, type, client, dataset selection)
- [x] ReportsPage: View Report modal (markdown rendering), Edit Report modal (title/content/publish toggle), delete with confirm
- [x] ClientDashboardPage: Client portal page — reads client info from AuthContext (userType, cin, fullName)
- [x] ClientDashboardPage: Stats (dashboards, reports, AI reports), "My Performance Reports" list, "Published Dashboards" grid
- [x] ClientDashboardPage: Uses `/client/reports` endpoint for authenticated clients, `/public/reports` for fallback
- [x] PublicDashboardPage: Standalone public page (no sidebar, no login required) with gradient header, published dashboards/reports, view report modal, "Sign in" link
- [x] DashboardCanvasPage: Added `isPublic` state, publish/unpublish Switch with GlobalOutlined/LockOutlined icons in toolbar
- [x] Sidebar: Added "Clients" nav group (Clients, Reports) for super_admin/admin/teacher roles
- [x] Sidebar: Added "My Portal" nav group for student/alumni roles
- [x] Sidebar: Dashboard link hidden for client users (roles filter)
- [x] App.tsx: Routes for /clients, /reports (RoleRoute), /portal, /public (public, no auth)
- [x] AppLayout: Route titles for /clients, /reports, /portal
- [x] LoginPage: Segmented toggle between Staff (email) and Client (username) login forms
- [x] LoginPage: Client login form with username+password, "Default password is your CIN number" hint
- [x] LoginPage: Authenticated client users redirect to /portal instead of /dashboard
- [x] AuthContext: `clientLogin` function (calls /auth/client-login, sets userType:'client' on user object)
- [x] AuthContext: Verify-on-mount flow persists user from getMe to localStorage (handles both staff and client tokens)
- [x] types.ts: User interface extended with `userType`, `cin`, `username` fields
- [x] types.ts: Dashboard interface extended with `is_public`, `created_by_name` fields
- [x] types.ts: Client and Report interfaces added
- [x] Installed papaparse + @types/papaparse in frontend
- [x] Frontend `tsc --noEmit` passes with 0 errors

## Phase 9: Polish ✅
- [x] PublicDashboardPage: Error state with Alert component; `handleViewReport` shows `message.error` on failure
- [x] AIAnalysisPage: Removed unused `React` import and `const { Panel } = Collapse`; added `historyError` state + Alert banner when chat history fails; tables fetch shows `message.error` instead of silent catch
- [x] SavedQueriesPage: Fixed "Save as Chart" button — now navigates to `/charts` instead of fake `message.success`; added `useNavigate` hook; added `aria-label` attributes to all icon-only action buttons
- [x] DashboardCanvasPage: Added `.catch()` on `Promise.all` with `message.error`; removed `console.error` from PDF export; wrapped publish/unpublish `Switch` in `Popconfirm`; added `aria-label` on drag handles and remove buttons; chart data fetch shows `message.warning` per failed chart
- [x] ChartBuilderPage: Added `.catch()` on `Promise.all` with `message.error`; added `aria-label` attributes to View, Edit, Duplicate, Delete chart buttons
- [x] ReportsPage: Wrapped publish/unpublish in `Popconfirm` with descriptive messages; added `aria-label` attributes to action buttons
- [x] SettingsPage: Replaced local `alert` state + `<Alert>` component with `message.success/error` for consistency
- [x] DashboardPage: Charts fetch failure shows `message.warning` instead of silent catch
- [x] SurveyGeneratorPage: Saved surveys fetch failure shows `message.error` instead of silent catch
- [x] ForeignKeyManagerPage: Wrapped "Apply All" button in `Popconfirm` to confirm before bulk-creating FK links

### Remaining Polish Items (lower priority)
- [ ] Integrate i18n (react-i18next) for ~500+ hardcoded strings across all 28 files
- [ ] Convert manual form validation to Ant Design Form.Item rules in 5 pages
- [ ] Fix non-reactive `window.innerWidth` for modal widths (5 occurrences in SavedQueriesPage, DataImportPage)
- [ ] Add keyboard handlers to DatabaseExplorerPage cards for accessibility
- [ ] Add `<Empty>` component to AIAnalysisPage chat area and UsersPage desktop table
- [ ] Fix eslint-disable comments for useEffect dependencies in DashboardCanvasPage and TableEditorPage

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (React 19)                      │
│                                                              │
│  ┌───────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────┐ │
│  │ThemeContext│ │AuthCtx   │ │NotifContext  │ │  Router    │ │
│  │(ConfigProv│ │(JWT,User)│ │(Bell,Read)   │ │(React-     │ │
│  │ 5 schemes │ │          │ │              │ │ Router v7) │ │
│  │ light/dark│ │          │ │              │ │            │ │
│  └─────┬─────┘ └────┬─────┘ └──────┬───────┘ └─────┬─────┘ │
│        │            │              │               │        │
│  ┌─────▼────────────▼──────────────▼───────────────▼──────┐ │
│  │               Ant Design Components                     │ │
│  │                                                         │ │
│ │ Pages (20 routes): │ │
│ │ /dashboard /import /explore /explore/:id /ai │ │
│ │ /charts /dashboards /surveys /queries /relations │ │
│ │ /users /roles /clients /reports /portal /settings │ │
│ │ │ │
│ │ Public: / /docs /login /public │ │
│  └─────────────────────┬───────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────┘
                         │ Axios (JWT interceptor, 401 redirect)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Express Backend (Port 5000)                    │
│                                                              │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│ │ Auth │ │ Datasets │ │ AI │ │ Charts/Dashbd │ │
│ │ Routes │ │ Routes │ │ Routes │ │ Routes │ │
│ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬─────────┘ │
│ │ │ │ │ │
│ ┌────▼────────────▼────────────▼──────────────▼──────────┐ │
│ │ Foreign Keys │ Saved Queries │ Notifications │ │
│ └───────────────────────┬────────────────────────────────┘ │
│ │ │
│ ┌────────────────────────▼────────────────────────────────┐ │
│ │ Clients │ Reports │ Public Endpoints │ │
│ └───────────────────────┬────────────────────────────────┘ │
│  │         Middleware (JWT Auth, RBAC, Multer)              │ │
│  └───────────────────────────┬────────────────────────────┘ │
│                              │                               │
│  ┌───────────────────────────▼────────────────────────────┐ │
│  │           PostgreSQL 15 (Docker Volume)                 │ │
│  │                                                         │ │
│ │ Tables: users, roles, permissions, role_permissions, │ │
│ │ user_roles, datasets, charts, dashboards, surveys, │ │
│ │ ai_queries, foreign_keys, saved_queries, notifications,│ │
│ │ clients, reports │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow: AI Query

```
User Question ──► POST /api/ai/query
                        │
                        ▼
              ┌─────────────────────┐
              │  Groq AI Service     │
              │  (llama-3.3-70b)     │
              │                      │
              │  Prompt includes:    │
              │  - All table schemas │
              │  - Column types      │
              │  - User question     │
              └─────────┬────────────┘
                        │
              ┌─────────▼────────────┐
              │  Generated SQL       │
              │  (SELECT only)       │
              │  Safety check        │
              └─────────┬────────────┘
                        │
              ┌─────────▼────────────┐
              │  Execute on PG       │
              │  (LIMIT 1000)        │
              └─────────┬────────────┘
                        │
              ┌─────────▼────────────┐
              │  Insights Generation │
              │  (2nd Groq call)     │
              └─────────┬────────────┘
                        │
                        ▼
              Response: {sql, data, rowCount, insights}
```

## Component Architecture

```
main.tsx
└── ThemeProvider (ConfigProvider + 5 color schemes + dark/light)
    └── App
        └── BrowserRouter
            ├── AuthProvider
│ ├── / → LandingPage [public]
│ ├── /docs → DocsPage [public]
│ ├── /login → LoginPage [public]
│ ├── /public → PublicDashboardPage [public]
│ └── ProtectedRoute
│ └── NotificationProvider
│ └── AppLayout
│ ├── Layout.Sider → Sidebar (nav, user, theme)
│ └── Layout
│ ├── Header Bar (title, bell, avatar)
│ └── Content → Outlet
│ ├── /dashboard → DashboardPage
│ ├── /import → DataImportPage
│ ├── /explore → DatabaseExplorerPage
│ ├── /explore/:id → TableEditorPage
│ ├── /ai → AIAnalysisPage
│ ├── /charts → ChartBuilderPage
│ ├── /dashboards → DashboardCanvasPage
│ ├── /surveys → SurveyGeneratorPage
│ ├── /queries → SavedQueriesPage
│ ├── /relations → ForeignKeyManagerPage
│ ├── /users → UsersPage [RoleRoute]
│ ├── /roles → RolesPage [RoleRoute]
│ ├── /clients → ClientsPage [RoleRoute]
│ ├── /reports → ReportsPage [RoleRoute]
│ ├── /portal → ClientDashboardPage [client users]
│ └── /settings → SettingsPage
            └── * → Navigate to /
```

## Database Schema

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│    users      │────<│  user_roles  │>────│     roles        │
│──────────────│     │──────────────│     │──────────────────│
│ id (PK)      │     │ user_id (FK) │     │ id (PK)          │
│ email        │     │ role_id (FK) │     │ name (UNIQUE)    │
│ password_hash│     └──────────────┘     │ description      │
│ full_name    │                           │ is_system        │
│ role         │     ┌──────────────────┐  └────────┬─────────┘
│ is_active    │────<│ role_permissions │>──────────┤
│ preferences  │     │──────────────────│            │
│ created_at   │     │ role_id (FK)     │   ┌──────────────────┐
│ updated_at   │     │ permission_id(FK)│   │   permissions    │
└──────┬───────┘     └──────────────────┘   │──────────────────│
       │                                      │ id (PK)          │
       │                                      │ name (UNIQUE)    │
       │                                      │ description      │
       │                                      │ category         │
       │                                      └──────────────────┘
       │
       │     ┌──────────────┐     ┌──────────────────┐
       ├────>│   datasets   │────>│ foreign_keys      │
       │     │──────────────│     │──────────────────│
       │     │ id (PK)      │     │ id (PK)          │
       │     │ name         │     │ source_table      │
       │     │ file_name    │     │ source_column     │
       │     │ table_name   │     │ target_table      │
       │     │ status       │     │ target_column     │
       │     │ row_count    │     │ created_by (FK)   │
       │     │ column_mapping│    │ created_at        │
       │     │ uploaded_by   │     └──────────────────┘
       │     │ created_at    │
       │     └──────┬───────┘     ┌──────────────────┐
       │            │             │  saved_queries    │
       │            │             │──────────────────│
       │     ┌──────▼───────┐    │ id (PK)          │
       │     │    charts    │    │ title             │
       │     │──────────────│    │ sql               │
       │     │ id (PK)      │    │ description       │
       │     │ title        │    │ is_public         │
       │     │ chart_type   │    │ created_by (FK)   │
       │     │ dataset_id   │    │ created_at        │
       │     │ config       │    │ updated_at        │
       │     │ created_by   │    └──────────────────┘
       │     │ created_at   │
       │     └──────────────┘     ┌──────────────────┐
       │                           │  notifications   │
       │     ┌──────────────┐     │──────────────────│
       │     │  dashboards  │     │ id (PK)          │
       │     │──────────────│     │ user_id (FK)     │
       │     │ id (PK)      │     │ type             │
       │     │ title        │     │ title            │
       │     │ description  │     │ message          │
       │     │ layout       │     │ is_read          │
       │     │ created_by   │     │ created_at       │
       │     └──────────────┘     └──────────────────┘
       │
       │     ┌──────────────┐     ┌──────────────────┐
       ├────>│   surveys    │     │   ai_queries     │
       │     │──────────────│     │──────────────────│
       │     │ id (PK)      │     │ id (PK)          │
       │     │ user_id (FK) │     │ user_id (FK)     │
       │     │ title        │     │ question         │
       │     │ description  │     │ created_at       │
       │     │ goal         │     └──────────────────┘
       │     │ schema       │
│ │ created_at │
│ └──────────────┘
│
│ ┌──────────────┐ ┌──────────────────┐
├────>│ clients │ │ reports │
│ │──────────────│ │──────────────────│
│ │ id (PK) │ │ id (PK) │
│ │ cin (UNIQUE) │ │ title │
│ │ username │ │ content │
│ │ full_name │ │ report_type │
│ │ email │ │ client_id (FK) │
│ │ phone │ │ dataset_id (FK) │
│ │ client_type │ │ is_public │
│ │ is_active │ │ created_by (FK) │
│ │ password_hash│ │ created_at │
│ │ created_by │ │ updated_at │
│ │ created_at │ └──────────────────┘
│ │ updated_at │
│ └──────────────┘
│
│ dashboards: +is_public column
└─────────────────────────────────────────────────────
```

## API Endpoints (Complete)

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | None | Staff login (email+password) |
| POST | /api/auth/client-login | None | Client login (username+password) |
| GET | /api/auth/me | JWT | Get current user (handles staff & client tokens) |
| PUT | /api/auth/me | JWT | Update profile (handles staff & client tokens) |
| PUT | /api/auth/me/password | JWT | Change password (handles staff & client tokens) |
| PATCH | /api/auth/me/preferences | JWT | Update preferences (staff only) |

### Users & Roles
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/users | users.view | List users |
| GET | /api/users/:id | users.view | Get user |
| POST | /api/users | users.create | Create user |
| PUT | /api/users/:id | users.edit | Update user |
| DELETE | /api/users/:id | users.delete | Delete user |
| GET | /api/roles | roles.view | List roles |
| GET | /api/roles/permissions | roles.view | List permissions |
| POST | /api/roles | roles.create | Create role |
| PUT | /api/roles/:id | roles.edit | Update role |
| DELETE | /api/roles/:id | roles.delete | Delete role |

### Datasets & Data
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/datasets/upload | data.import | Upload file |
| GET | /api/datasets | data.view | List datasets |
| GET | /api/datasets/:id | data.view | Get dataset |
| GET | /api/datasets/:id/preview | data.import | Preview file |
| POST | /api/datasets/:id/import | data.import | Import to table |
| GET | /api/datasets/:id/data | data.view | Query table data |
| GET | /api/datasets/:id/schema | data.view | Get table schema |
| GET | /api/datasets/:id/profile | data.view | Profile column stats |
| PATCH | /api/datasets/:id/rows/:rowId | data.import | Update cell |
| POST | /api/datasets/:id/rows | data.import | Insert row |
| DELETE | /api/datasets/:id/rows | data.delete | Delete rows |
| PATCH | /api/datasets/:id/columns/:col/rename | data.import | Rename column |
| PATCH | /api/datasets/:id/columns/:col/type | data.import | Change column type |
| DELETE | /api/datasets/:id | data.delete | Delete dataset+table |

### Foreign Keys
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/foreign-keys | data.view | List FK links |
| POST | /api/foreign-keys | data.import | Create FK link (with type checking) |
| POST | /api/foreign-keys/ai-suggest | ai.query | AI FK suggestions |
| DELETE | /api/foreign-keys/:id | data.import | Delete FK link |

### Charts & Dashboards
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/charts | analytics.create | Create chart |
| GET | /api/charts | analytics.view | List charts |
| GET | /api/charts/:id | analytics.view | Get chart |
| GET | /api/charts/:id/data | analytics.view | Get chart data |
| PUT | /api/charts/:id | analytics.create | Update chart |
| DELETE | /api/charts/:id | analytics.create | Delete chart |
| POST | /api/dashboards | analytics.create | Create dashboard |
| GET | /api/dashboards | analytics.view | List dashboards |
| PUT | /api/dashboards/:id | analytics.create | Update dashboard |
| DELETE | /api/dashboards/:id | analytics.create | Delete dashboard |

### AI & Analysis
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| POST | /api/ai/query | ai.query | Natural language query |
| GET | /api/ai/history | ai.query | Chat history |
| DELETE | /api/ai/history | ai.query | Clear history |
| GET | /api/ai/tables | ai.query | List queryable tables |
| POST | /api/ai/survey/generate | surveys.create | Generate survey |

### Saved Queries
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/saved-queries | data.view | List saved queries |
| POST | /api/saved-queries | analytics.create | Save query |
| PUT | /api/saved-queries/:id | analytics.create | Update query |
| DELETE | /api/saved-queries/:id | analytics.create | Delete query |
| POST | /api/saved-queries/:id/execute | analytics.view | Execute query |

### Notifications
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/notifications | auth | List user notifications |
| POST | /api/notifications | admin | Create notification |
| PATCH | /api/notifications/:id/read | auth | Mark as read |
| PATCH | /api/notifications/read-all | auth | Mark all as read |
| DELETE | /api/notifications/:id | auth | Delete notification |

### Clients
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/clients | clients.view | List clients |
| GET | /api/clients/:id | clients.view | Get client |
| POST | /api/clients | clients.create | Create client |
| PUT | /api/clients/:id | clients.edit | Update client |
| DELETE | /api/clients/:id | clients.delete | Delete client |
| POST | /api/clients/bulk-import | clients.import | Bulk import from CSV |

### Reports
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/reports | reports.view | List reports |
| GET | /api/reports/:id | reports.view | Get report |
| POST | /api/reports/generate | reports.generate | Generate AI report |
| PUT | /api/reports/:id | reports.generate | Update report |
| DELETE | /api/reports/:id | reports.generate | Delete report |

### Client Portal (authenticated clients)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/client/reports | JWT (client) | List client's own + public reports |
| GET | /api/client/reports/:id | JWT (client) | Get single report (own or public) |

### Public (no auth required)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/public/dashboards | None | List published dashboards |
| GET | /api/public/dashboards/:id | None | Get public dashboard |
| GET | /api/public/reports | None | List published reports |
| GET | /api/public/reports/:id | None | Get public report |

### Surveys & Stats
| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | /api/surveys | auth | List user surveys |
| POST | /api/surveys | auth | Save survey |
| DELETE | /api/surveys/:id | auth | Delete survey |
| GET | /api/surveys/:id/export/html | auth | Export as HTML |
| GET | /api/stats | auth | Dashboard statistics |
| GET | /api/health | none | Health check |
| GET | /api/health/db | none | DB health check |

## RBAC Permission Matrix

``` Permissions    super_admin admin teacher analyst viewer student alumni
users.view      ✓          ✓     ✗       ✗      ✗      ✗       ✗
users.create    ✓          ✓     ✗       ✗      ✗      ✗       ✗
users.edit      ✓          ✓     ✗       ✗      ✗      ✗       ✗
users.delete    ✓          ✓     ✗       ✗      ✗      ✗       ✗
roles.view      ✓          ✓     ✗       ✗      ✗      ✗       ✗
roles.create    ✓          ✓     ✗       ✗      ✗      ✗       ✗
roles.edit      ✓          ✓     ✗       ✗      ✗      ✗       ✗
roles.delete    ✓          ✗     ✗       ✗      ✗      ✗       ✗
data.import     ✓          ✓     ✓       ✗      ✗      ✗       ✗
data.view       ✓          ✓     ✓       ✓      ✓      ✗       ✗
data.delete     ✓          ✓     ✗       ✗      ✗      ✗       ✗
analytics.view  ✓          ✓     ✓       ✓      ✓      ✗       ✗
analytics.create ✓         ✓     ✓       ✓      ✗      ✗       ✗
ai.query        ✓          ✓     ✓       ✓      ✗      ✗       ✗
surveys.view    ✓          ✓     ✓       ✓      ✓      ✗       ✗
surveys.create  ✓          ✓     ✓       ✗      ✗      ✗       ✗
surveys.manage  ✓          ✓     ✓       ✗      ✗      ✗       ✗
clients.view    ✓          ✓     ✓       ✗      ✗      ✗       ✗
clients.create  ✓          ✓     ✓       ✗      ✗      ✗       ✗
clients.edit    ✓          ✓     ✗       ✗      ✗      ✗       ✗
clients.delete  ✓          ✓     ✗       ✗      ✗      ✗       ✗
clients.import  ✓          ✓     ✗       ✗      ✗      ✗       ✗
reports.generate ✓         ✓     ✓       ✗      ✗      ✗       ✗
reports.view    ✓          ✓     ✓       ✗      ✗      ✗       ✗
dashboards.publish ✓       ✓     ✗       ✗      ✗      ✗       ✗
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.2 |
| Frontend | TypeScript | 5.9 |
| Frontend | Vite | 7.3 |
| Frontend | Ant Design | 6.3 |
| Frontend | Chart.js | 4.5 |
| Frontend | @dnd-kit | 6.3 |
| Frontend | jsPDF | 4.2 |
| Frontend | Axios | 1.13 |
| Backend | Express | 4.21 |
| Backend | TypeScript | 5.7 |
| Backend | PostgreSQL driver | 8.13 |
| Backend | Groq SDK | 0.37 |
| Backend | bcryptjs | 2.4 |
| Backend | jsonwebtoken | 9.0 |
| Backend | multer | 2.1 |
| Backend | papaparse | 5.5 |
| Backend | exceljs | 4.4 |
| Database | PostgreSQL | 15 |
| Runtime | Node.js | 20 (Alpine) |
| Deploy | Docker Compose | — |
