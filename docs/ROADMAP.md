# Development Roadmap — Adaptive Observatory

## ✅ Phase 1: Foundation & Secure Perimeter
- [x] Docker Compose with three services: `frontend`, `backend`, `db`.
- [x] PostgreSQL init script that seeds the first Super Admin.
- [x] JWT Authentication (Login only — Register disabled).
- [x] React base layout: Sidebar with grouped navigation + Protected Route.

## ✅ Phase 2: RBAC & User Management
- [x] Permissions schema (`roles`, `permissions`, `user_roles`).
- [x] Backend middleware for permission-based route protection.
- [x] Admin User Management UI (List, Add, Edit, Delete, Assign Roles).
- [x] Self-delete prevention (UI + API layer).

## ✅ Phase 3: Adaptive Ingestion Engine
- [x] File upload (Multer) + CSV/Excel parsing (PapaParse / ExcelJS).
- [x] Mapping workspace UI (select file → map headers to SQL types).
- [x] Dynamic `CREATE TABLE` / `ALTER TABLE` query builder.
- [x] Bulk import worker with type coercion and error reporting.

## ✅ Phase 4: AI & Analytical Intelligence
- [x] Groq API integration with exponential-backoff retry and rate-limit handling.
- [x] NL-to-SQL pipeline: schema-aware prompt → safe read-only query execution.
- [x] Second-pass insights: Groq call with actual results → natural-language analysis.
- [x] Inline chart builder inside the chat: visualise any result as Bar, H-Bar, Line, Pie, or Doughnut.
- [x] AI Survey Generator: type a goal → AI returns structured JSON survey.
- [x] AI query logging to `ai_queries` table (used for usage stats on dashboard).

## ✅ Phase 5: Visual Dashboard Editor
- [x] Chart Builder: pick dataset → X/Y axis → aggregation → chart type → save.
- [x] Supported types: Bar, Horizontal Bar, Line, Pie, Doughnut, Radar, Polar Area.
- [x] Drag-and-drop Dashboard Canvas (@dnd-kit) with named dashboards.
- [x] Live data sync when opening a dashboard.
- [x] PDF export (jsPDF + autotable) and Excel export.

## ✅ Phase 6: Survey System
- [x] Dynamic Survey Engine (AI-generated JSON → rendered form).
- [x] Public shareable URL + QR code for each published survey.
- [x] Response collection stored in PostgreSQL.
- [x] Admin response viewer.

## ✅ Phase 7: Database Explorer & Table Editor
- [x] Explorer card grid (row count, column count, created date).
- [x] Full table editor: inline cell edit, add row, multi-select delete.
- [x] Schema editor: rename columns, change column types.
- [x] Column sort, keyword search, pagination.
- [x] Drop table with confirmation.

## ✅ Phase 8: UI Polish & Aerogel Design System
- [x] Aerogel CSS variable design system (surface layers, accent, semantic colours).
- [x] Sidebar redesign: grouped nav, initials avatar, gradient brand, collapse/expand.
- [x] DB Explorer card redesign: accent bar, pill badge, footer CTA, hover lift.
- [x] Consistent component classes: `ag-card`, `ag-btn-primary`, `ag-input`, `ag-table-*`, `ag-badge`.

## 🔜 Phase 9: Hardening & Production Readiness
- [ ] Rate limiting on AI endpoints (express-rate-limit).
- [ ] Input sanitisation audit (XSS / SQLi).
- [ ] Nginx reverse proxy config for production Docker build.
- [ ] Health-check endpoints for all services.
- [ ] Automated database backup script.
