# Development Roadmap: The Adaptive Observatory

## Phase 1: Foundation & Secure Perimeter
- **Task 1.1**: Initialize Docker Compose with three services: `frontend`, `backend`, `db`.
- **Task 1.2**: Create the PostgreSQL initialization script to seed the first **Super Admin**.
- **Task 1.3**: Implement JWT Authentication logic (Login only, Register disabled).
- **Task 1.4**: Build the React base layout with a Sidebar and Protected Route components.

## Phase 2: RBAC & User Management
- **Task 2.1**: Implement the Permissions Database Schema (`roles`, `permissions`, `user_roles`).
- **Task 2.2**: Create Backend Middleware to check for specific permissions on API routes.
- **Task 2.3**: Build the Admin User Management UI (List, Add, Edit, Delete, and Assign Roles).

## Phase 3: The Adaptive Ingestion Engine
- **Task 3.1**: Implement File Upload (Multer) and Excel/CSV parsing (ExcelJS/PapaParse).
- **Task 3.2**: Create the "Mapping Workspace" UI (Select a file -> Map headers to Types).
- **Task 3.3**: Develop the Dynamic Query Builder to create new PostgreSQL tables based on the map.
- **Task 3.4**: Build the Bulk Import worker to populate the new tables with validated data.

## Phase 4: AI & Analytical Intelligence
- **Task 4.1**: Integrate the AI API (Gemini/OpenAI) with the Node.js backend.
- **Task 4.2**: Implement "NL-to-SQL": A chat interface that generates and executes read-only SQL queries.
- **Task 4.3**: Create the AI Survey Generator (Type a goal -> AI generates a JSON-based survey).

## Phase 5: Visual Dashboard Editor
- **Task 5.1**: Build the "Chart Builder" tool (Pick dynamic table -> Select X/Y axis -> Select Chart Type).
- **Task 5.2**: Implement a Drag-and-Drop Dashboard Canvas for arranging multiple charts.
- **Task 5.3**: Develop the Export Engine for PDF (jsPDF) and Excel (ExcelJS).

## Phase 6: Survey System & Final Polish
- **Task 6.1**: Build the Dynamic Survey Engine (Public-facing forms for Alumni/Companies).
- **Task 6.2**: Implement the "Project Management" Dashboard to track all dynamic tables and activity logs.
- **Task 6.3**: Final Performance Audit & Security Hardening (XSS, SQLi Prevention, Rate Limiting).