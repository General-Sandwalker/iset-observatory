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
│  │ Pages (16 routes):                                      │ │
│  │  /dashboard  /import  /explore  /explore/:id  /ai       │ │
│  │  /charts  /dashboards  /surveys  /queries  /relations   │ │
│  │  /users  /roles  /settings                             │ │
│  │                                                         │ │
│  │ Public: /  /docs  /login                               │ │
│  └─────────────────────┬───────────────────────────────────┘ │
└────────────────────────┼─────────────────────────────────────┘
                         │ Axios (JWT interceptor, 401 redirect)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Express Backend (Port 5000)                    │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │  Auth    │ │ Datasets │ │   AI     │ │ Charts/Dashbd  │ │
│  │  Routes  │ │  Routes  │ │  Routes  │ │    Routes      │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬─────────┘ │
│       │            │            │              │            │
│  ┌────▼────────────▼────────────▼──────────────▼──────────┐ │
│  │     Foreign Keys  │  Saved Queries  │  Notifications   │ │
│  └───────────────────────┬────────────────────────────────┘ │
│                           │                                  │
│  ┌────────────────────────▼────────────────────────────────┐ │
│  │         Middleware (JWT Auth, RBAC, Multer)              │ │
│  └───────────────────────────┬────────────────────────────┘ │
│                              │                               │
│  ┌───────────────────────────▼────────────────────────────┐ │
│  │           PostgreSQL 15 (Docker Volume)                 │ │
│  │                                                         │ │
│  │  Tables: users, roles, permissions, role_permissions,   │ │
│  │  user_roles, datasets, charts, dashboards, surveys,    │ │
│  │  ai_queries, foreign_keys, saved_queries, notifications│ │
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
            │   ├── / → LandingPage [public]
            │   ├── /docs → DocsPage [public]
            │   ├── /login → LoginPage [public]
            │   └── ProtectedRoute
            │       └── NotificationProvider
            │           └── AppLayout
            │               ├── Layout.Sider → Sidebar (nav, user, theme)
            │               └── Layout
            │                   ├── Header Bar (title, bell, avatar)
            │                   └── Content → Outlet
            │                       ├── /dashboard → DashboardPage
            │                       ├── /import → DataImportPage
            │                       ├── /explore → DatabaseExplorerPage
            │                       ├── /explore/:id → TableEditorPage
            │                       ├── /ai → AIAnalysisPage
            │                       ├── /charts → ChartBuilderPage
            │                       ├── /dashboards → DashboardCanvasPage
            │                       ├── /surveys → SurveyGeneratorPage
            │                       ├── /queries → SavedQueriesPage
            │                       ├── /relations → ForeignKeyManagerPage
            │                       ├── /users → UsersPage
            │                       ├── /roles → RolesPage
            │                       └── /settings → SettingsPage
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
       │     │ created_at   │
       │     └──────────────┘
       └─────────────────────────────────────────────────────
```

## API Endpoints (Complete)

### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | None | Login with email+password |
| GET | /api/auth/me | JWT | Get current user |
| PUT | /api/auth/me | JWT | Update profile |
| PUT | /api/auth/me/password | JWT | Change password |
| PATCH | /api/auth/me/preferences | JWT | Update preferences |

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
| POST | /api/foreign-keys | data.import | Create FK link |
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

```
                    super_admin  admin  analyst  viewer
users.view              ✓         ✓       ✗        ✗
users.create            ✓         ✓       ✗        ✗
users.edit              ✓         ✓       ✗        ✗
users.delete            ✓         ✓       ✗        ✗
roles.view              ✓         ✓       ✗        ✗
roles.create            ✓         ✓       ✗        ✗
roles.edit              ✓         ✓       ✗        ✗
roles.delete            ✓         ✗       ✗        ✗
data.import             ✓         ✓       ✗        ✗
data.view               ✓         ✓       ✓        ✓
data.delete             ✓         ✓       ✗        ✗
analytics.view          ✓         ✓       ✓        ✓
analytics.create        ✓         ✓       ✓        ✗
ai.query                ✓         ✓       ✓        ✗
surveys.view            ✓         ✓       ✓        ✓
surveys.create          ✓         ✓       ✗        ✗
surveys.manage          ✓         ✓       ✗        ✗
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
