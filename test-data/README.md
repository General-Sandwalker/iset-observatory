# ISET Observatory - Test Data

This folder contains comprehensive test data for all use cases of the ISET Observatory platform.

## Files Overview

| File | Format | Rows | Description |
|------|--------|------|-------------|
| `seed_test_data.sql` | SQL | - | Full database seed script (all tables) |
| `students.csv` | CSV | 50 | Student registry with 8-digit CINs |
| `grades.csv` | CSV | 106 | Student grades by subject/semester/year |
| `departments.csv` | CSV | 3 | ISET departments (Informatique, Electrique, Gestion) |
| `courses_results.csv` | CSV | 16 | Course results (pass rate, avg grade, enrolled/passed/failed) |
| `alumni_employment.csv` | CSV | 12 | Alumni employment data (employer, salary, sector, city) |
| `clients_bulk_import.csv` | CSV | 7 | Client bulk import with password column mapping |

## Quick Start

### Option A: Full SQL Seed (recommended)

Reset and seed the entire database:

```bash
# From the project root, connect to the Docker database
docker compose exec db psql -U observatory -d observatory_db -f /dev/stdin < test-data/seed_test_data.sql

# Or if database is on host:
psql -h localhost -U observatory -d observatory_db -f test-data/seed_test_data.sql
# Password: observatory_secret
```

This creates:
- 5 staff users
- 8 client users
- 5 dynamic data tables (students, grades, departments, courses_results, alumni_employment)
- 9 charts (8 chart types)
- 3 dashboards (2 public, 1 private)
- 2 foreign key links
- 5 saved queries
- 3 surveys
- 3 reports
- 10 notifications
- 7 AI query audit entries

### Option B: CSV Import via UI

Import individual CSV files through the Data Import page:

1. Login as admin
2. Go to **Data Import** page
3. Upload a CSV file (e.g., `students.csv`)
4. Map columns and confirm import

For client bulk import:
1. Go to **Clients** page
2. Click **Bulk Import**
3. Upload `clients_bulk_import.csv`
4. Map columns: CIN -> cin, Full Name -> fullName, Username -> username, etc.
5. Select **Password** column (or leave blank to use CIN as default password)

## Test Account Credentials

### Staff Accounts

| Email | Password | Role | Notes |
|-------|----------|------|-------|
| `admin@iset-tozeur.tn` | `Admin@123!` | super_admin | Full access |
| `analyst@iset-tozeur.tn` | (hashed) | analyst | Data & analytics |
| `viewer@iset-tozeur.tn` | (hashed) | viewer | Read-only |
| `teacher@iset-tozeur.tn` | (hashed) | admin | Teacher+admin |
| `inactive@iset-tozeur.tn` | (hashed) | viewer | Disabled account |

> Note: Only the super_admin account uses a real bcrypt hash from the seed. Other staff passwords in this SQL are dummy hashes — replace them or create accounts via the UI.

### Client Accounts

| CIN | Username | Password | Type | Name |
|-----|----------|----------|------|------|
| `09727760` | ahmed.benali | (CIN: 09727760) | student | Ahmed Ben Ali |
| `09727761` | fatma.trabelsi | (custom) | student | Fatma Trabelsi |
| `09727762` | rami.kouki | (CIN: 09727762) | student | Rami Kouki |
| `09727763` | nour.hamdi | (custom) | student | Nour Hamdi |
| `09727764` | yassine.guedri | (email) | alumni | Yassine Guedri |
| `09727765` | amina.khelifi | (email) | alumni | Amina Khelifi |
| `09727766` | sami.bouaziz | (custom) | teacher | Dr. Sami Bouaziz |
| `09727767` | leila.gharbi | (custom) | teacher | Dr. Leila Gharbi |

> Client passwords in the SQL are dummy hashes. Use the **Bulk Import** feature from the UI to create clients with real bcrypt-hashed passwords.

### Using clients_bulk_import.csv

This CSV includes a `Password` column demonstrating flexible password assignment:

- **CIN as password**: Row 1 (ahmed.benali) and Row 3 (rami.kouki) use their CIN
- **Custom password**: Row 2 (fatma2023) and Row 4 (nour2024)
- **Email as password**: Row 5 (yassine@iset) and Row 6 (amina@iset)
- **Teacher passwords**: Row 7 (sami2024) and Row 8 (leila2024)

During import, select "Password" as the **Password Column** in the bulk import form.

## Data Relationships

```
data_students.cin  ────  data_grades.student_cin    (FK link 1)
data_students.cin  ────  clients.cin                (FK link 2)
```

These are **logical** foreign keys stored in the `foreign_keys` table, not actual PostgreSQL constraints.

## CIN Format

All CINs in this test data are **8-digit numbers** (stored as VARCHAR to preserve leading zeros):

- Format: `097277XX` (e.g., `09727720`, `09727760`)
- Students: `09727720` - `09727759`
- Clients: `09727760` - `09727767`
