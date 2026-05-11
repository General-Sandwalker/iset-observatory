# Test Data — ISET Observatory

This folder contains comprehensive test data for all use cases of the ISET Observatory platform.

## Files

| File | Description |
|------|-------------|
| `seed_test_data.sql` | SQL script that seeds the database with all test data (users, clients, datasets, charts, dashboards, FK links, saved queries, surveys, reports, notifications, AI query audit rows) |
| `students.csv` | CSV file for testing the Data Import feature — student registry (20 rows) |
| `grades.csv` | CSV file for testing the Data Import feature — grade records (32 rows) |
| `departments.csv` | CSV file for testing the Data Import feature — department lookup (3 rows) |
| `clients_bulk_import.csv` | CSV file for testing the Client Bulk Import feature (8 rows with password column) |

## How to Seed the Database

### Option 1: Copy and run inside the Docker db container

```bash
docker compose cp "test data/seed_test_data.sql" db:/tmp/seed_test_data.sql
docker compose exec db psql -U postgres -d iset_observatory -f /tmp/seed_test_data.sql
```

### Option 2: Run from the host via psql

```bash
psql -h localhost -p 5432 -U postgres -d iset_observatory -f "test data/seed_test_data.sql"
```

> The script uses `BEGIN`/`COMMIT` so it runs as a single transaction. If any insert fails, all changes are rolled back.

## Test Accounts

### Staff Users (login at /login — Staff tab)

| Email | Password | Role | Active |
|-------|----------|------|--------|
| admin@iset-tozeur.tn | Admin@123! | super_admin | yes (seeded by app) |
| analyst@iset-tozeur.tn | Analyst@123! | analyst | yes |
| viewer@iset-tozeur.tn | Viewer@123! | viewer | yes |
| disabled@iset-tozeur.tn | Disabled@123! | viewer | no |
| teacher@iset-tozeur.tn | Teacher@123! | teacher | yes |

### Client Users (login at /login — Client tab)

| Username | Password | CIN | Type | Active |
|----------|----------|-----|------|--------|
| ahmed.benali | Pass@123! | ST001 | student | yes |
| fatma.trabelsi | Pass@123! | ST002 | student | yes |
| rami.kouki | Pass@123! | ST003 | student | no |
| nour.hamdi | Pass@123! | ST004 | student | yes |
| yassine.guedri | Pass@123! | ST005 | student | yes |
| mohamed.jlassi | Pass@123! | AL001 | alumni | yes |
| sarra.boukadida | Pass@123! | AL002 | alumni | yes |
| leila.bouazizi | TeacherPass1! | TC001 | teacher | yes |

## What the Seed Creates

### Users & Roles
- 4 additional staff users (analyst, viewer, disabled, teacher) with proper role assignments
- 1 custom role: `data_entry` (non-system, with `data.import` + `data.view` permissions)

### Clients
- 5 students (ST001-ST005, one inactive: ST003)
- 2 alumni (AL001, AL002)
- 1 teacher client (TC001)

### Dynamic Tables (imported datasets)
- **dyn_students** — 50 rows (40 current students + 10 alumni), with CIN, full_name, department, enrollment_year, gpa, is_active. Includes NULL gpa values for profiling tests.
- **dyn_grades** — 100 rows with student_cin matching dyn_students, subject, grade, semester, year. Covers Informatique, Electrique, and Gestion departments.
- **dyn_departments** — 3 rows (lookup table for FK testing)

### Datasets Registry
- 3 imported datasets (Students, Grades, Departments) with column mappings
- 1 uploaded (pending) dataset
- 1 error dataset

### Charts (9)
- Bar: Students by Department
- Pie: Average GPA by Department
- Line: Grade Distribution by Year
- Horizontal Bar: Top Students by GPA
- Doughnut: Grade Breakdown by Semester
- Radar: Department Student Radar
- Area: Student Enrollment Trend
- Bar (AI-saved): AI Query Department Count (uses SQL config, no dataset_id)
- Polar Area: Active vs Inactive Students

### Dashboards (3)
- **Student Performance Overview** — public, 4 charts
- **Academic Analytics** — private, 4 charts
- **Department Insights** — public, 2 charts

### Foreign Keys (2)
- dyn_grades.student_cin → dyn_students.cin
- dyn_students.department → dyn_departments.dept_name

### Saved Queries (5)
- 3 public queries (All Active Students, Average Grade by Subject, Grade Distribution Summary)
- 2 private queries (Students Needing Support, Department Enrollment Trends)

### Surveys (3)
- Student Satisfaction Survey 2024 (9 fields: text, email, select, rating, radio, checkbox, textarea, number, date)
- Course Feedback — Algorithmique (6 fields: text, rating×2, radio, textarea, checkbox)
- Alumni Career Survey (6 fields: text, email, select, text, number, textarea)

### Reports (3)
- Client-specific performance report for Ahmed Ben Ali (ST001, private)
- Client-specific performance report for Fatma Trabelsi (ST002, private)
- Annual Academic Report 2023 (public, no client_id)

### Notifications (10)
- 6 for super_admin (info, success, warning×2, error, 3 unread)
- 2 for analyst (info, warning)
- 2 for teacher (info, success)

### AI Query Audit (7)
- 3 queries from super_admin, 2 from analyst, 2 from teacher (within last 48 hours)

## Use Case Coverage

| Use Case | Test Data |
|----------|-----------|
| User Management | 4 staff users with different roles, 1 inactive, 1 custom role |
| Role Management | 7 system roles (seeded) + 1 custom role with 2 permissions |
| Client Management | 8 clients (5 students, 2 alumni, 1 teacher), 1 inactive |
| Client Bulk Import | `clients_bulk_import.csv` with 8 rows and password column |
| Data Import | 3 CSV files (students, grades, departments) |
| Data Exploration | 3 dynamic tables with 50/100/3 rows |
| AI Analysis | 7 audit rows + dynamic tables provide schema context |
| Chart Building | 9 charts covering 8 chart types with varied configs |
| Dashboard Creation | 3 dashboards (2 public, 1 private) with chart layouts |
| Foreign Keys | 2 FK links between 3 dynamic tables |
| Saved Queries | 5 queries (3 public, 2 private), includes JOIN query |
| Surveys | 3 surveys with all field types (text, textarea, number, select, radio, checkbox, date, email, rating) |
| Reports | 3 reports (2 client-specific, 1 public annual) |
| Notifications | 10 notifications covering all 4 types (info, success, warning, error) |
| Public Portal | 2 public dashboards + 1 public report |
| Client Portal | 2 client-specific reports + public reports |
| Statistics Dashboard | All counters populated (datasets, charts, dashboards, AI queries) |

## Testing CSV Import via the UI

1. Log in as admin or teacher
2. Go to **Import Data** page
3. Upload `students.csv`, `grades.csv`, or `departments.csv`
4. Preview the file, map columns, and import

## Testing Client Bulk Import

1. Log in as admin
2. Go to **Clients** page
3. Click **Bulk Import**
4. Upload `clients_bulk_import.csv`
5. Map columns — set the **Password** column to the `Password` column from the CSV
6. Review results

## Resetting Test Data

To start fresh, tear down and recreate the database:

```bash
docker compose down -v
docker compose up -d
# Wait for migrations to apply, then re-seed:
docker compose cp "test data/seed_test_data.sql" db:/tmp/seed_test_data.sql
docker compose exec db psql -U postgres -d iset_observatory -f /tmp/seed_test_data.sql
```
