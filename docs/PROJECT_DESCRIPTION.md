# ISET Tozeur — Adaptive Digital Observatory

## 1. Project Vision

The **Adaptive Digital Observatory** is a full-stack data management and analytics platform built for ISET Tozeur. It centralises academic and professional-integration data (alumni tracking, course results, student records) and exposes them through AI-assisted analysis, interactive dashboards, and a schema-agnostic import engine.

Unlike rigid fixed-schema software, the platform acts as a **"Data Engine"**: administrators import any CSV/Excel file, visually map columns to SQL types, and the system creates a live PostgreSQL table — no migrations written by hand.

---

## 2. Core Modules

### A. Adaptive Data Ingestion
- **Schema-agnostic**: Accepts any CSV or Excel file regardless of column names or layout.
- **Visual mapping workspace**: Users match file headers to SQL data types (TEXT, INTEGER, NUMERIC, DATE, BOOLEAN).
- **Dynamic schema generation**: Executes `CREATE TABLE` in PostgreSQL based on the mapping.
- **Bulk import worker**: Streams rows into the new table with type-coercion and error reporting.
- **Dataset management**: Browse imported datasets, view row counts, re-import, or delete.

### B. Database Explorer & Table Editor
- **Explorer view**: Card grid of all dynamic tables showing row count, column count, and import date.
- **Table editor**: Full CRUD on every row — paginated view, inline cell editing (double-click), add-row modal, multi-select delete.
- **Schema editor**: Rename columns, change column types, or drop the entire table.
- **Search & sort**: Per-table column-level sorting and keyword search across all columns.

### C. AI-Assisted Analysis
- **Natural Language → SQL**: Chat interface where users type plain-English questions (e.g. *"What is the average GPA by department?"*); the AI generates a read-only SELECT query using the live schema.
- **Two-stage Groq pipeline**:
  1. NL → SQL generation (schema-aware prompt).
  2. Results → Insights (second call with actual data; produces a 2–4 sentence natural-language interpretation with bold key figures).
- **Inline chart builder**: Any query result can be visualised instantly — pick chart type (Bar, Horizontal Bar, Line, Pie, Doughnut), label column, and value column without leaving the chat.
- **Conversation history**: Session history stored per user with a one-click clear.
- **Safety**: Only SELECT queries are executed; non-SELECT AI output is blocked server-side.

### D. Chart Builder & Dashboards
- **Chart builder**: Pick a dataset → choose X axis (group-by) → choose Y axis (aggregation: COUNT / SUM / AVG / MIN / MAX) → select chart type → preview → save.
- **Supported chart types**: Bar, Horizontal Bar, Line, Pie, Doughnut, Radar, Polar Area.
- **Dashboard canvas**: Drag-and-drop grid editor; add saved charts as widgets, resize, rearrange, and name dashboards.
- **Live sync**: Dashboard widgets refresh data on every open.
- **PDF & Excel export**: One-click export for any dashboard.

### E. Survey Generator & Publisher
- **AI-generated surveys**: Describe a goal in plain language; the AI returns a fully structured survey (field labels, types, options, validation rules).
- **Supported field types**: Text, Textarea, Number, Select, Radio, Checkbox, Date, Email, Rating.
- **Public sharing**: Each survey gets a unique shareable URL and a QR code for printing.
- **Response collection**: Submissions stored in PostgreSQL; results viewable in the admin panel.

### F. Identity & Access Control (RBAC)
- **No public registration**: All accounts seeded by admins.
- **Seeded Super Admin**: Created on first boot via Docker environment variables.
- **Role management**: Create custom roles, assign granular permissions, attach roles to users.
- **Self-protection**: Admins cannot delete their own account.
- **JWT authentication**: Stateless bearer tokens with server-side verification on every request.

---

## 3. Technical Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| UI Components | Lucide React icons, Chart.js 4 + react-chartjs-2 |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable |
| PDF Export | jsPDF + jspdf-autotable |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL 15 |
| AI | Groq (llama / deepseek models) with retry + rate-limit handling |
| Auth | bcryptjs + JWT |
| File Parsing | ExcelJS + PapaParse (via multer upload) |
| Deployment | Docker + Docker Compose (multi-container) |

---

## 4. Deployment

The application ships as three Docker services defined in `docker-compose.yml`:

- **`db`** — PostgreSQL 15 with an init script that seeds the super admin account.
- **`backend`** — Express API on port 5000 with auto-migration runner on startup.
- **`frontend`** — Vite dev server (or Nginx for production builds) on port 5173.

All secrets (DB credentials, Groq API key, JWT secret, super admin password) are injected via environment variables — no secrets are committed to source control.
