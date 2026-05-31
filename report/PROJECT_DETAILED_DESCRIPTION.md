# ISET Observatory - Project Detailed Description

## Project Overview

**ISET Observatory** (also called **Observatory Analysis**) is a web-based data management, analytics, and visualization platform built for the Higher Institute of Technological Studies (ISET) of Tozeur, Tunisia. The platform enables administrators to import, explore, analyze, and visualize institutional data through an intuitive interface. It features AI-powered natural language querying, interactive chart building, dashboard composition, survey management, and role-based access control.

**Developer:** Noureddine Jabnouni  
**Supervisor:** Mr. BEN MAHMOUD Soufiene  
**Host Organization:** ISET Tozeur  
**Technologies:** React 19, TypeScript, Node.js, Express, PostgreSQL 15, Groq AI, Chart.js  

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Database Schema](#3-database-schema)
4. [Authentication & Authorization](#4-authentication--authorization)
5. [Frontend Components](#5-frontend-components)
6. [Backend API Endpoints](#6-backend-api-endpoints)
7. [Data Import Pipeline](#7-data-import-pipeline)
8. [Chart Builder System](#8-chart-builder-system)
9. [Dashboard Canvas](#9-dashboard-canvas)
10. [AI Integration](#10-ai-integration)
11. [Survey System](#11-survey-system)
12. [Client Portal](#12-client-portal)
13. [Theme System](#13-theme-system)
14. [Internationalization](#14-internationalization)
15. [Test Data](#15-test-data)

---

## 1. System Architecture

The application follows a three-tier architecture pattern:

- **Frontend (Presentation Layer):** React 19 SPA with Vite, Ant Design UI, Chart.js, i18next
- **Backend (Application Layer):** Node.js with Express 5, TypeScript, JWT authentication
- **Database (Data Layer):** PostgreSQL 15 with dynamic table creation for imported datasets

The entire stack runs in Docker containers orchestrated by Docker Compose.

### Architecture Diagram

![System Architecture](res/diagram-system-architecture.png)

*Figure: System architecture showing client, server, service, and data layers*

### Container Structure

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `observatory-db` | postgres:15-alpine | 5432 | PostgreSQL database |
| `observatory-backend` | Custom Node.js | 5000 | Express API server |
| `observatory-frontend` | Custom React/Vite | 5173 | Frontend SPA |

### Data Flow

1. User interacts with React SPA in browser
2. Frontend sends HTTP requests to Express API via Axios
3. API middleware authenticates (JWT) and authorizes (RBAC) requests
4. Controllers process requests using services (AI, parser, table builder)
5. Services interact with PostgreSQL via raw SQL queries
6. Responses flow back through the same chain

---

## 2. Technology Stack

### Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.0 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 6.x | Build tool & dev server |
| Ant Design | 6.3.7 | UI component library |
| Chart.js | 4.5.1 | Charting library |
| react-chartjs-2 | 5.3.1 | React chart wrapper |
| Axios | 1.13.6 | HTTP client |
| React Router DOM | 7.13.1 | Client-side routing |
| i18next | 26.0.10 | Internationalization |
| react-i18next | 17.0.7 | React i18n bindings |
| @dnd-kit/core | 6.3.1 | Drag-and-drop |
| jsPDF | 4.2.0 | PDF export |
| PapaParse | 5.5.3 | CSV parsing |
| dayjs | 1.11.20 | Date manipulation |

### Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 | Runtime |
| Express | 4.21.1 | HTTP framework |
| TypeScript | 5.7 | Type safety |
| PostgreSQL (pg) | 8.13.1 | Database driver |
| jsonwebtoken | 9.0.2 | JWT auth |
| bcryptjs | 2.4.3 | Password hashing |
| Groq SDK | 0.37.0 | AI integration (LLM) |
| Multer | 2.1.0 | File uploads |
| PapaParse | 5.5.3 | CSV parsing |
| ExcelJS | 4.4.0 | Excel file parsing |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Docker & Docker Compose | Container orchestration |
| PostgreSQL 15 | Relational database |
| Groq AI (qwen/qwen3-32b) | LLM for NL queries & text generation |
| Railway | Backend hosting/deployment |
| Vercel | Frontend hosting/deployment |

---

## 3. Database Schema

The database uses PostgreSQL 15 with a schema managed by automated migrations. There are 14 migrations that create the following tables:

### Core Tables

#### `users`
Stores staff/admin user accounts for system access.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| email | VARCHAR(255) UNIQUE | User email |
| password_hash | VARCHAR(255) | Bcrypt-hashed password |
| full_name | VARCHAR(255) | Display name |
| role | VARCHAR(50) | User role (super_admin, admin, analyst, viewer) |
| is_active | BOOLEAN | Account status |
| user_type | VARCHAR(50) | 'staff' or 'client' |
| preferences | JSONB | User preferences (theme, language) |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `permissions`
System permissions for granular access control.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| name | VARCHAR(100) UNIQUE | Permission key (e.g., 'users.view') |
| description | TEXT | Human-readable description |
| category | VARCHAR(50) | Grouping category |

#### `roles`
User roles with associated permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| name | VARCHAR(100) UNIQUE | Role name |
| description | TEXT | Description |
| is_system | BOOLEAN | System-protected role |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `role_permissions`
Junction table linking roles to permissions.

| Column | Type | Description |
|--------|------|-------------|
| role_id | INT FK→roles | Role reference |
| permission_id | INT FK→permissions | Permission reference |

#### `user_roles`
Junction table linking users to roles.

| Column | Type | Description |
|--------|------|-------------|
| user_id | INT FK→users | User reference |
| role_id | INT FK→roles | Role reference |

### Permissions (Seeded)

| Permission | Category | Description |
|------------|----------|-------------|
| users.view | users | View user list |
| users.create | users | Create new users |
| users.edit | users | Edit existing users |
| users.delete | users | Delete users |
| roles.view | roles | View roles |
| roles.create | roles | Create roles |
| roles.edit | roles | Edit roles |
| roles.delete | roles | Delete roles |
| data.import | data | Import data files |
| data.view | data | View dynamic tables |
| data.delete | data | Delete dynamic tables |
| analytics.view | analytics | View analytics & dashboards |
| analytics.create | analytics | Create charts & dashboards |
| ai.query | ai | Use AI natural language queries |
| surveys.view | surveys | View surveys |
| surveys.create | surveys | Create surveys |
| surveys.manage | surveys | Manage survey responses |
| clients.view | users | View client accounts |
| clients.create | users | Create client accounts |
| clients.edit | users | Edit client accounts |
| clients.delete | users | Delete client accounts |
| clients.import | users | Bulk import clients from CSV |
| reports.generate | analytics | Generate AI performance reports |
| reports.view | analytics | View published reports |
| dashboards.publish | analytics | Publish dashboards publicly |

### System Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| super_admin | Full system access | All permissions |
| admin | Administrative access | All except roles.delete |
| analyst | Data & analytics | data.view, analytics.view, analytics.create, ai.query, surveys.view |
| viewer | Read-only access | data.view, analytics.view, surveys.view |
| student | Client role | Portal access (published dashboards, surveys) |
| alumni | Client role | Portal access |
| teacher | Client + staff role | data.view, data.import, analytics, ai, surveys, clients |

### Data Tables

#### `datasets`
Registry of imported files.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| name | VARCHAR(255) | Human-readable dataset name |
| file_name | VARCHAR(255) | Original filename |
| table_name | VARCHAR(255) UNIQUE | Generated dynamic table name |
| status | VARCHAR(50) | 'uploaded', 'imported', 'error' |
| row_count | INT | Number of imported rows |
| column_mapping | JSONB | Original header → column name + type mapping |
| uploaded_by | INT FK→users | User who uploaded |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `charts`
Saved chart configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| title | VARCHAR(255) | Chart title |
| chart_type | VARCHAR(50) | bar, line, pie, doughnut, radar, polarArea, scatter, bubble, area, horizontalBar |
| dataset_id | INT FK→datasets | Source dataset (nullable for AI SQL charts) |
| config | JSONB | Chart configuration (columns, aggregation, colors) |
| created_by | INT FK→users | Chart creator |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `dashboards`
Dashboard collections containing charts.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| title | VARCHAR(255) | Dashboard title |
| description | TEXT | Dashboard description |
| layout | JSONB | Chart position layout (x, y, w, h) |
| is_public | BOOLEAN | Public visibility flag |
| created_by | INT FK→users | Dashboard creator |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `surveys`
Survey definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| user_id | INT FK→users | Survey creator |
| title | VARCHAR(255) | Survey title |
| description | TEXT | Description |
| goal | TEXT | Survey goal/purpose |
| schema | JSONB | Field definitions |
| status | VARCHAR(20) | 'draft' or 'published' |
| is_public | BOOLEAN | Public access flag |
| client_types | JSONB | Target audience types |
| responses_count | INT | Number of responses |
| published_at | TIMESTAMPTZ | Publication date |

#### `survey_responses`
Individual survey responses.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| survey_id | INT FK→surveys | Survey reference |
| client_id | INT FK→clients | Client reference (nullable) |
| respondent_type | VARCHAR(20) | 'student', 'alumni', 'anonymous' |
| answers | JSONB | Response answers |
| submitted_at | TIMESTAMPTZ | Submission time |

#### `clients`
Client accounts (students, alumni, teachers).

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| cin | VARCHAR(50) UNIQUE | National ID number |
| username | VARCHAR(100) UNIQUE | Login username |
| full_name | VARCHAR(255) | Full name |
| email | VARCHAR(255) | Email address |
| phone | VARCHAR(50) | Phone number |
| client_type | VARCHAR(50) | 'student', 'alumni', 'teacher' |
| is_active | BOOLEAN | Account status |
| password_hash | VARCHAR(255) | Bcrypt-hashed password |
| created_by | INT FK→users | Admin who created |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `reports`
AI-generated performance reports.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| title | VARCHAR(255) | Report title |
| content | TEXT | Markdown report content |
| report_type | VARCHAR(50) | 'performance', 'department', 'employment' |
| client_id | INT FK→clients | Client reference |
| dataset_id | INT FK→datasets | Dataset reference |
| is_public | BOOLEAN | Public visibility |
| created_by | INT FK→users | Report creator |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `foreign_keys`
Logical foreign key relationships between tables.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| source_table | VARCHAR(255) | Source table name |
| source_column | VARCHAR(255) | Source column name |
| target_table | VARCHAR(255) | Target table name |
| target_column | VARCHAR(255) | Target column name |
| created_by | INT FK→users | Creator reference |

#### `saved_queries`
Saved SQL queries.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| title | VARCHAR(255) | Query title |
| sql | TEXT | SQL query text |
| description | TEXT | Description |
| is_public | BOOLEAN | Public visibility |
| created_by | INT FK→users | Creator reference |

#### `notifications`
In-app notification system.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| user_id | INT FK→users | Recipient |
| type | VARCHAR(20) | 'info', 'success', 'warning', 'error' |
| title | VARCHAR(255) | Notification title |
| message | TEXT | Notification message |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### `ai_queries`
Audit log of AI queries.

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL PK | Auto-increment ID |
| user_id | INT FK→users | Query author |
| question | TEXT | Natural language question |
| created_at | TIMESTAMPTZ | Query timestamp |

### Class Diagram

![Class Diagram](res/diagram-class_diagram.png)

*Figure: Database entity relationship diagram showing all tables and their relationships*

---

## 4. Authentication & Authorization

### Authentication Flow

The system uses JWT (JSON Web Token) for stateless authentication.

**Staff Login:** Users login with email + password via `POST /api/auth/login`. The backend verifies credentials using bcrypt and returns a signed JWT token.

**Client Login:** Clients (students, alumni, teachers) login with username + password via `POST /api/auth/client-login`.

**Token Management:**
- JWT token is stored in `localStorage` on the frontend
- Token expiry: 24 hours (configurable via `JWT_EXPIRES_IN`)
- Every authenticated request includes `Authorization: Bearer <token>` header
- On 401 response, token is cleared and user is redirected to login

![Login Sequence](res/diagram-sequence_login.png)

*Figure: Authentication sequence diagram showing the login flow*

### Authorization (RBAC)

The system implements Role-Based Access Control with the following structure:
1. **Roles** define permission sets
2. **Permissions** define granular actions
3. **Users** are assigned roles (via `user_roles` junction)
4. **Role Permissions** map roles to permissions

The authorization middleware chain:
1. `authenticate`: Validates JWT token and attaches user to request
2. `authorize(roles[])`: Checks user has one of the required roles
3. `requirePermission(permission)`: Checks user has the specific permission

---

## 5. Frontend Components

### Layout Components

#### AppLayout
The main authenticated layout wrapping all dashboard pages. Features:
- Collapsible sidebar navigation
- Sticky top header with page title, notification bell, user avatar
- Content area with React Router Outlet

#### Sidebar
Collapsible navigation with sections:
- **Brand:** "Observatory / ISET Tozeur" logo
- **Data section:** Import, Explorer, Relations, Queries
- **Analytics section:** Charts, Dashboards, Reports
- **Admin section:** Users, Roles, Clients
- **AI section:** AI Analysis, Surveys
- **Portal:** Client Portal
- **Bottom:** Theme toggle, user info, logout

#### ThemeContext
React context that manages:
- Theme mode: `light` or `dark`
- Color schemes: `ocean` (blue), `forest` (green), `sunset` (orange), `lavender` (purple), `crimson` (red)
- Persists to localStorage (`obs-theme`, `obs-color-scheme`)
- Wraps app in Ant Design `ConfigProvider` with dynamic theme tokens

### Page Components

#### LandingPage (`/`)
Public landing page showcasing the platform with marketing content.

#### LoginPage (`/login`)
Login page with two tabs:
- **Staff login:** Email + password fields
- **Client login:** Username + password fields

#### DashboardPage (`/dashboard`)
Main dashboard showing:
- KPI statistics cards (users, clients, datasets, charts, dashboards)
- Quick action buttons
- AI-powered insights
- Popular charts gallery
- Recent activity feed

#### DataImportPage (`/import`)
CSV/Excel file import interface:
- Drag-and-drop file upload
- URL import option
- Column mapping wizard with preview
- Column type configuration (text, integer, decimal, date, boolean)
- Import to database

#### DatabaseExplorerPage (`/explore`)
Browse all imported datasets as interactive table cards:
- Search, filter, and sort datasets
- Table name, row count, status indicators
- Click to open table editor

#### TableEditorPage (`/explore/:id`)
Full table data editor:
- Paginated, searchable table view
- Inline row editing, insertion, deletion
- Schema viewer with column metadata
- Column rename and type conversion
- Data profiling (null counts, unique values, min/max/avg)
- Export to CSV or JSON
- Foreign key relationship display
- Row count statistics

#### ChartBuilderPage (`/charts`)
Chart creation and management tool:
- 10 chart types: bar, line, pie, doughnut, radar, polarArea, scatter, bubble, area, horizontalBar
- Column mapping: X-axis, Y-axis, aggregation (COUNT, SUM, AVG, MIN, MAX)
- Color scheme selection
- Display options (legend, grid, labels, animation)
- Reusable chart library

#### DashboardCanvasPage (`/dashboards`)
Multi-chart dashboard composer:
- Drag-and-drop chart layout using @dnd-kit
- Add/remove charts from library
- Auto-refresh interval
- PDF export with cover page, chart titles, page numbers
- Publish/unpublish dashboards

#### AIAnalysisPage (`/ai`)
AI-powered natural language query interface:
- Chat-like interface for questions
- Available tables list
- Suggested questions
- Chat history
- SQL query output with results table
- AI-generated insights
- Save results as charts

#### SurveyGeneratorPage (`/surveys`)
AI-assisted survey design:
- Define survey goal → AI generates field schema
- Manual field creation (text, email, number, textarea, select, radio, rating)
- Draft/publish workflow
- Shareable survey links
- Response collection and statistics

#### SettingsPage (`/settings`)
User settings hub:
- Profile editing (name, email)
- Password change
- Theme: light/dark + 5 color schemes
- Language: English/French
- Notification preferences
- Data preferences
- Danger zone (account deletion)

#### UsersPage (`/users`)
User management (admin only):
- User list with search
- Create/edit users
- Activate/deactivate accounts
- Delete users
- Bulk operations

#### RolesPage (`/roles`)
Role management (admin only):
- Role list with CRUD
- Permission assignment with visual matrix
- Role comparison
- System role protection

#### ClientsPage (`/clients`)
Client account management:
- Client list with search
- CRUD operations
- Bulk import from CSV
- Client type filtering (student, alumni, teacher)

#### ReportsPage (`/reports`)
AI-generated reports:
- Report list with search
- AI report generation
- View/edit reports in markdown
- Publish/unpublish
- Export options

#### ForeignKeyManagerPage (`/relations`)
Manage logical foreign key relationships:
- Manual linking between tables
- Auto-detect relationships
- AI-suggested relationships
- Visual ERD-like representation

#### SavedQueriesPage (`/queries`)
SQL query manager:
- Saved query list with search
- Execute queries directly
- View results in table
- Export results
- AI query builder assistant

#### ClientDashboardPage (`/portal`)
Client portal showing:
- Published dashboards
- Available surveys
- Performance reports
- Profile management

#### PublicDashboardPage (`/public`)
Public view of published dashboards (no auth required).

#### PublicSurveyPage (`/public/surveys/:id`)
Public survey form (no auth required).

---

## 6. Backend API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/public/dashboards` | List public dashboards |
| GET | `/api/public/dashboards/:id` | Get public dashboard |
| GET | `/api/public/dashboards/:id/charts` | Get charts in public dashboard |
| GET | `/api/public/charts/:id/data` | Get chart data |
| GET | `/api/public/surveys` | List published surveys |
| GET | `/api/public/surveys/:id` | Get survey form |
| POST | `/api/public/surveys/:id/responses` | Submit anonymous response |
| GET | `/api/public/reports` | List public reports |
| GET | `/api/public/reports/:id` | Get public report |

### Client Endpoints (Client Auth)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/client/surveys` | List available surveys |
| POST | `/api/client/surveys/:id/responses` | Submit survey response |
| GET | `/api/client/reports` | List client reports |
| GET | `/api/client/reports/:id` | Get client report |

### Authentication

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/login` | Staff login |
| POST | `/api/auth/client-login` | Client login |
| GET | `/api/auth/me` | Get current user profile |
| PUT | `/api/auth/me` | Update profile |
| PUT | `/api/auth/me/password` | Change password |
| PATCH | `/api/auth/me/preferences` | Update preferences |

### Admin/Staff Endpoints

#### User Management
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/users` | users.view |
| GET | `/api/users/:id` | users.view |
| POST | `/api/users` | users.create |
| PUT | `/api/users/:id` | users.edit |
| DELETE | `/api/users/:id` | users.delete |

#### Role Management
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/roles/permissions` | roles.view |
| GET | `/api/roles` | roles.view |
| GET | `/api/roles/:id` | roles.view |
| POST | `/api/roles` | roles.create |
| PUT | `/api/roles/:id` | roles.edit |
| DELETE | `/api/roles/:id` | roles.delete |

#### Data Management
| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/api/datasets/upload` | data.import |
| GET | `/api/datasets` | data.view |
| GET | `/api/datasets/:id` | data.view |
| GET | `/api/datasets/:id/preview` | data.import |
| POST | `/api/datasets/:id/import` | data.import |
| GET | `/api/datasets/:id/data` | data.view |
| GET | `/api/datasets/:id/schema` | data.view |
| PATCH | `/api/datasets/:id/rows/:rowId` | data.import |
| POST | `/api/datasets/:id/rows` | data.import |
| DELETE | `/api/datasets/:id/rows` | data.delete |
| DELETE | `/api/datasets/:id` | data.delete |
| PATCH | `/api/datasets/:id/columns/:colName/rename` | data.import |
| PATCH | `/api/datasets/:id/columns/:colName/type` | data.import |
| GET | `/api/datasets/:id/profile` | data.view |

#### Charts & Dashboards
| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/api/charts` | analytics.create |
| GET | `/api/charts` | analytics.view |
| GET | `/api/charts/:id` | analytics.view |
| GET | `/api/charts/:id/data` | analytics.view |
| PUT | `/api/charts/:id` | analytics.create |
| DELETE | `/api/charts/:id` | analytics.create |
| POST | `/api/dashboards` | analytics.create |
| GET | `/api/dashboards` | analytics.view |
| GET | `/api/dashboards/:id` | analytics.view |
| PUT | `/api/dashboards/:id` | analytics.create |
| DELETE | `/api/dashboards/:id` | analytics.create |

#### AI
| Method | Endpoint | Permission |
|--------|----------|------------|
| POST | `/api/ai/query` | ai.query |
| GET | `/api/ai/history` | ai.query |
| DELETE | `/api/ai/history` | ai.query |
| GET | `/api/ai/tables` | ai.query |
| POST | `/api/ai/survey/generate` | surveys.create |

#### Surveys
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/surveys` | Authenticated |
| POST | `/api/surveys` | Authenticated |
| GET | `/api/surveys/:id` | Authenticated |
| PUT | `/api/surveys/:id` | Authenticated |
| DELETE | `/api/surveys/:id` | Authenticated |
| GET | `/api/surveys/:id/responses` | Authenticated |

#### Foreign Keys
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/foreign-keys` | data.view |
| POST | `/api/foreign-keys` | data.import |
| POST | `/api/foreign-keys/ai-suggest` | data.view |
| DELETE | `/api/foreign-keys/:id` | data.import |

#### Saved Queries
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/saved-queries` | analytics.view |
| POST | `/api/saved-queries` | analytics.create |
| PUT | `/api/saved-queries/:id` | analytics.create |
| DELETE | `/api/saved-queries/:id` | analytics.create |
| POST | `/api/saved-queries/:id/execute` | analytics.view |

#### Clients
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/clients` | clients.view |
| GET | `/api/clients/:id` | clients.view |
| POST | `/api/clients` | clients.create |
| PUT | `/api/clients/:id` | clients.edit |
| DELETE | `/api/clients/:id` | clients.delete |
| POST | `/api/clients/bulk-import` | clients.import |

#### Reports
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/reports` | reports.view |
| GET | `/api/reports/:id` | reports.view |
| POST | `/api/reports/generate` | reports.generate |
| PUT | `/api/reports/:id` | reports.generate |
| DELETE | `/api/reports/:id` | reports.generate |

#### Notifications
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/notifications` | Authenticated |
| POST | `/api/notifications` | super_admin/admin |
| PATCH | `/api/notifications/read-all` | Authenticated |
| PATCH | `/api/notifications/:id/read` | Authenticated |
| DELETE | `/api/notifications/:id` | Authenticated |

#### Stats
| Method | Endpoint | Permission |
|--------|----------|------------|
| GET | `/api/stats` | Authenticated |

---

## 7. Data Import Pipeline

The data import pipeline is one of the core features of the platform. It allows administrators to import CSV or Excel files and automatically create PostgreSQL tables.

### Import Process

![Data Import Sequence](res/diagram-sequence_data_import.png)

*Figure: Sequence diagram showing the data import workflow*

### Steps:

1. **Upload:** User uploads a CSV/Excel file via `POST /api/datasets/upload` (multipart form). The file is saved to `uploads/` directory and parsed for preview.

2. **Preview:** Backend extracts headers and first 5 rows for preview via `GET /api/datasets/:id/preview`. Returns column names, types, sample data.

3. **Column Mapping:** Frontend displays a column mapping interface where the user can:
   - Rename columns
   - Select column types (TEXT, INTEGER, DECIMAL, DATE, BOOLEAN)

4. **Import:** User confirms import via `POST /api/datasets/:id/import`. Backend:
   - Creates a dynamic PostgreSQL table with the mapped schema
   - Reads all rows from the file using `parseFile()` or `readAllRows()`
   - Bulk inserts rows using parameterized queries via `bulkInsert()`
   - Updates the dataset status and row count

5. **Verification:** Dataset appears in the Database Explorer with status "imported" and the correct row count.

### Dynamic Table Naming

Tables are named `data_{tablename}` (e.g., `data_students`, `data_grades`) to avoid conflicts with system tables.

### Supported File Formats

| Format | MIME Types | Parser |
|--------|------------|--------|
| CSV | text/csv, text/plain | PapaParse |
| Excel (.xlsx) | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | ExcelJS |
| Excel (.xls) | application/vnd.ms-excel | ExcelJS |

---

## 8. Chart Builder System

### Supported Chart Types

| Type | Description | Best For |
|------|-------------|----------|
| Bar | Vertical bar chart | Comparing categories |
| Horizontal Bar | Horizontal bar chart | Long category names |
| Line | Line chart with points | Time series / trends |
| Pie | Pie slices | Part-to-whole proportions |
| Doughnut | Doughnut chart | Part-to-whole (with center) |
| Radar | Multi-axis radar chart | Multi-variable comparison |
| Polar Area | Polar area chart | Cyclical data patterns |
| Scatter | XY scatter plot | Correlation analysis |
| Bubble | Bubble chart | Three-dimensional data |
| Area | Filled area chart | Cumulative trends |

### Chart Configuration

Charts store their configuration in a JSONB column with the following structure:

```json
{
  "xColumn": "department",
  "yColumn": "gpa",
  "aggregation": "AVG",
  "colorScheme": "ocean",
  "showLegend": true,
  "showGrid": true,
  "showLabels": true,
  "enableAnimation": true,
  "sql": "SELECT ..." // for AI-generated charts
}
```

Supported aggregations: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`, `NONE`

### Color Schemes

| Scheme | Colors |
|--------|--------|
| ocean | Blues (default for light theme) |
| forest | Greens |
| sunset | Oranges/Reds |
| lavender | Purples |
| crimson | Red/Warm |

### Data Sources

Charts can source data from:
1. **Dynamic Tables:** Imported datasets with column-based configuration
2. **AI SQL:** Generated SQL queries from the AI analysis page
3. **Saved Queries:** Reusable SQL queries

---

## 9. Dashboard Canvas

### Features

- **Drag-and-drop layout:** Uses @dnd-kit for arranging chart widgets on a grid
- **Auto-refresh:** Configurable interval (30s, 60s, 300s)
- **PDF Export:** Uses jsPDF with jsPDF-autotable for multi-page A4 PDF reports
- **Publishing:** Toggle public/private visibility
- **Charts:** Add or remove charts from the library

### Layout Configuration

The dashboard layout is stored as a JSONB array:

```json
[
  { "chartId": 1, "x": 0, "y": 0, "w": 6, "h": 4 },
  { "chartId": 2, "x": 6, "y": 0, "w": 6, "h": 4 }
]
```

Charts are placed on a 12-column grid. Width (w) ranges from 1-12.

### PDF Export Features

- Cover page with dashboard title
- Chart images rendered in the PDF
- Page numbers and footers
- A4 format, landscape orientation for charts

---

## 10. AI Integration

### Groq AI Integration

The platform uses Groq's AI API with the `qwen/qwen3-32b` model for the following features:

1. **Natural Language to SQL:** Converts user questions into SQL queries
2. **Query Results Analysis:** Generates insights from query results
3. **Survey Field Generation:** Creates survey fields based on a goal description
4. **Foreign Key Suggestions:** Analyzes tables and suggests relationships
5. **Report Generation:** Generates performance report content

### AI Query Flow

![AI Query Sequence](res/diagram-sequence_ai_query.png)

*Figure: Sequence diagram showing the AI natural language query workflow*

### Natural Language Querying

The AI query endpoint (`POST /api/ai/query`) works as follows:

1. User submits a natural language question
2. Backend retrieves available table schemas
3. Sends a prompt to Groq AI with:
   - System instructions
   - Available table schemas (column names, types)
   - The user's question
4. Groq AI returns a SQL query
5. Backend executes the SQL against PostgreSQL
6. Backend may send results back to Groq for insight generation
7. Returns SQL + data + insights to frontend

### Services Module (`backend/src/services/ai.ts`)

Key functions:
- `naturalLanguageToSQL(question, tables)` - Converts NL to SQL
- `generateSurvey(goal)` - Generates survey fields from a goal
- `suggestForeignKeys(tables)` - Suggests FK relationships
- `generateReport(title, data)` - Generates report content

---

## 11. Survey System

### Survey Lifecycle

![Survey Activity](res/diagram-activity_survey.png)

*Figure: Activity diagram showing the survey creation and response workflow*

### Creating a Survey

1. Admin defines a survey goal (e.g., "Collect student satisfaction data")
2. AI generates suggested fields based on the goal
3. Admin reviews, edits, and adds fields
4. Survey saved as draft or published immediately
5. If published, target audience is configured (students, alumni, teachers)

### Field Types

| Type | Description | Options |
|------|-------------|---------|
| text | Single-line text input | - |
| email | Email input with validation | - |
| number | Numeric input | - |
| textarea | Multi-line text | - |
| select | Dropdown selection | Array of options |
| radio | Radio button group | Array of options |
| rating | 1-5 star rating | - |

### Survey Response Collection

Surveys can be taken:
- **By clients:** Through the client portal (authenticated)
- **By public:** Through a public link (anonymous)
- Responses are tracked per client to prevent duplication
- Response count is updated in real-time

---

## 12. Client Portal

### Client Types

| Type | Description | Capabilities |
|------|-------------|--------------|
| student | Current student | View dashboards, take surveys, view reports |
| alumni | Graduate | View dashboards, take surveys, view reports |
| teacher | Faculty member | View dashboards, manage surveys, view reports (with additional permissions when linked to staff account) |

### Portal Features

- **Published Dashboards:** View charts and analytics shared by administrators
- **Available Surveys:** Take surveys and provide feedback
- **Performance Reports:** View AI-generated reports
- **Profile Management:** Update personal information

### Public Access

- **Public Dashboards:** Any visitor can view published dashboards without authentication
- **Public Surveys:** Anonymous users can submit survey responses

---

## 13. Theme System

### Theme Configuration

The theme system supports two modes with five color schemes:

| Theme Mode | Description |
|------------|-------------|
| Light | Default light background with dark text |
| Dark | Dark background with light text |

| Color Scheme | Primary Color | Best For |
|--------------|---------------|----------|
| Ocean | Blue (#1677ff) | Default, professional |
| Forest | Green (#52c41a) | Academic, nature-themed |
| Sunset | Orange (#fa8c16) | Warm, energetic |
| Lavender | Purple (#722ed1) | Creative, modern |
| Crimson | Red (#f5222d) | Bold, impactful |

### Implementation

The theme is managed through React Context (`ThemeContext`) and persists to localStorage:
- `obs-theme`: 'light' or 'dark'
- `obs-color-scheme`: Ocean, Forest, Sunset, Lavender, Crimson

The context wraps the entire application in Ant Design's `ConfigProvider` with dynamically computed theme tokens.

---

## 14. Internationalization

### Languages Supported

| Language | Code | File |
|----------|------|------|
| English | en | `frontend/src/i18n/locales/en.json` |
| French | fr | `frontend/src/i18n/locales/fr.json` |

### Translation Structure

Each translation file contains ~1000 translation keys organized into sections:

- `common`: Shared UI strings
- `nav`: Navigation items
- `login`: Authentication strings
- `dashboard`: Dashboard page
- `import`: Data import page
- `explore`: Database explorer
- `tableEditor`: Table editor
- `ai`: AI analysis page
- `charts`: Chart builder
- `dashboards`: Dashboard canvas
- `surveys`: Survey generator
- `queries`: Saved queries
- `relations`: Foreign key manager
- `users`: User management
- `roles`: Role management
- `clients`: Client management
- `reports`: Reports page
- `portal`: Client portal
- `public`: Public pages
- `settings`: Settings page
- `landing`: Landing page
- `docs`: Documentation
- `notifications`: Notification system
- `auth`: Authentication-related strings

Language preference is persisted to localStorage (`i18n_lang`). Default language is French.

---

## 15. Test Data

### Seeded Test Data

The project includes a comprehensive seed script (`test-data/seed_test_data.sql`) that populates the database with realistic institutional data:

#### Staff Users
| Email | Role | Status |
|-------|------|--------|
| admin@iset-tozeur.tn | super_admin | Active |
| analyst@iset-tozeur.tn | analyst | Active |
| viewer@iset-tozeur.tn | viewer | Active |
| teacher@iset-tozeur.tn | admin | Active |
| inactive@iset-tozeur.tn | viewer | Inactive |

#### Clients
| CIN | Name | Type | Password |
|-----|------|------|----------|
| 09727760 | Ahmed Ben Ali | student | 12345678 |
| 09727761 | Fatma Trabelsi | student | 12345678 |
| 09727762 | Rami Kouki | student | 12345678 |
| 09727763 | Nour Hamdi | student | 12345678 |
| 09727764 | Yassine Guedri | alumni | alumni2024 |
| 09727765 | Amina Khelifi | alumni | alumni2024 |
| 09727766 | Dr. Sami Bouaziz | teacher | teacher2024 |
| 09727767 | Dr. Leila Gharbi | teacher | teacher2024 |

#### Imported Datasets

| Dataset | Table | Rows | Columns |
|---------|-------|------|---------|
| Etudiants ISET | data_students | 50 | CIN, full_name, department, enrollment_year, GPA, is_active |
| Notes des etudiants | data_grades | 106 | student_cin, subject, grade, semester, year |
| Departements ISET | data_departments | 3 | code, name, head, students_count, established_year, accreditation |
| Resultats des cours | data_courses_results | 16 | course_code, course_name, department, semester, year, instructor, enrolled, passed, failed, average_grade, pass_rate |
| Emploi des diplomes | data_alumni_employment | 12 | CIN, full_name, graduation_year, department, degree, current_employer, job_title, sector, monthly_salary, city, months_to_first_job, satisfied |

#### Pre-built Charts (9 charts)
1. Moyenne GPA par departement (bar)
2. Distribution des notes (pie)
3. Evolution des inscriptions (line)
4. Taux de reussite par cours (bar)
5. Etudiants actifs vs inactifs (doughnut)
6. Salaires par secteur (horizontalBar)
7. Nombre d etudiants par annee (bar)
8. Notes moyennes par semestre (line)
9. Repartition par departement (polarArea)

#### Pre-built Dashboards (3 dashboards)
1. Tableau de bord academique (published)
2. Tableau de bord emploi (published)
3. Tableau de bord interne (private)

#### Pre-built Surveys (3 surveys)
1. Satisfaction des etudiants (published)
2. Enquete alumni (published)
3. Evaluation des enseignants (published)

#### Pre-built Reports (3 reports)
1. Rapport de performance - Ahmed Ben Ali
2. Rapport global du departement Informatique
3. Rapport d insertion professionnelle

#### Saved Queries (5 queries)
1. Top 10 etudiants par GPA (public)
2. Notes moyennes par matiere (public)
3. Etudiants sans notes (private)
4. Taux de reussite par departement (public)
5. Emploi des diplomes par secteur (public)

#### Notifications (10 notifications)
Various types: info, success, warning - both read and unread.

#### AI Query History (7 entries)
Natural language questions asked by users, stored for audit.

#### Foreign Keys (2 links)
- data_grades.student_cin → data_students.cin
- data_students.cin → clients.cin

---

## Additional CSVs (for import via API)

The `test-data/raw/` directory contains additional CSV files for testing the import pipeline:

1. **students.csv** - 100 student records (id, nom, prenom, date_naissance, email, telephone, filiere, niveau, annee_inscription)
2. **survey_feedback_2026.csv** - 50 survey responses (respondent_id, date_reponse, satisfaction_globale, qualite_formation, recommandation, commentaires)
3. **employer_partners.csv** - 21 employer partner records (entreprise, secteur, ville, tel, email, site_web, nbre_stagiaires)

---

## Development Workflow

### Setting Up

```bash
git clone https://github.com/General-Sandwalker/iset-observatory.git
cd iset-observatory
cp .env.example .env
# Edit .env - set GROQ_API_KEY
docker compose up --build
```

Access the app at http://localhost:5173. Login with `admin@iset-tozeur.tn` / `Admin@123!`.

### Seeding Test Data

```bash
docker compose exec -T db psql -U observatory -d observatory_db < test-data/seed_test_data.sql
```

### Running Without Docker

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```
