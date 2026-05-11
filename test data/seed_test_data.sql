-- =============================================================================
-- ISET Observatory — Test Data Seed Script
-- =============================================================================
-- Run this AFTER the application migrations have been applied.
-- This script creates comprehensive test data for ALL use cases.
--
-- Usage:
--   docker compose cp "test data/seed_test_data.sql" db:/tmp/seed_test_data.sql
--   docker compose exec db psql -U postgres -d iset_observatory -f /tmp/seed_test_data.sql
--
-- Password reference:
--   admin@iset-tozeur.tn   → Admin@123!     (seeded by app)
--   analyst@iset-tozeur.tn → Analyst@123!
--   viewer@iset-tozeur.tn  → Viewer@123!
--   disabled@iset-tozeur.tn → Disabled@123!
--   teacher@iset-tozeur.tn → Teacher@123!
--   Client CIN as password for students/alumni (e.g. ST001, AL001)
--   teacher client: TeacherPass1!
-- =============================================================================

BEGIN;

-- ─── 1. STAFF USERS ──────────────────────────────────────────────────────────

INSERT INTO users (email, password_hash, full_name, role, is_active, user_type, preferences)
VALUES
  ('analyst@iset-tozeur.tn', '$2a$10$mGrC5SRT/Z9TNPRRqhDKF.H9l3v/A3cgtl/4peIZIXLPPuWyU..ee', 'Sana Bouazizi', 'analyst', true, 'staff', '{"theme":"ocean","mode":"light"}'),
  ('viewer@iset-tozeur.tn',  '$2a$10$.W/RVER/96WRbMdtIA1QSeWO9m9djE3eNjGlQB3ajzfQbBy7zR8my', 'Karim Haddad', 'viewer', true, 'staff', '{}'),
  ('disabled@iset-tozeur.tn','$2a$10$F0vZsRg9o8g6vmKkixptOuRE4dm4KLhyqcBk7rROxbHoyKRIHA7BS', 'Ines Maatouk', 'viewer', false, 'staff', '{}'),
  ('teacher@iset-tozeur.tn', '$2a$10$kO2L1Hoc/nkSPe47MyfYdOzHddfnaEcWitbD4.fBJL/XYgH9KI/xa', 'Dr. Moncef Ghanmi', 'teacher', true, 'staff', '{"theme":"forest","mode":"dark"}')
ON CONFLICT (email) DO NOTHING;

-- Assign roles via user_roles (get user IDs dynamically)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'analyst@iset-tozeur.tn' AND r.name = 'analyst'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'viewer@iset-tozeur.tn' AND r.name = 'viewer'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'disabled@iset-tozeur.tn' AND r.name = 'viewer'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'teacher@iset-tozeur.tn' AND r.name = 'teacher'
ON CONFLICT DO NOTHING;

-- ─── 2. CUSTOM ROLE ──────────────────────────────────────────────────────────

INSERT INTO roles (name, description, is_system)
VALUES ('data_entry', 'Data entry clerk — can import and view data only', false)
ON CONFLICT (name) DO NOTHING;

-- Assign data.import + data.view to data_entry role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'data_entry' AND p.name IN ('data.import', 'data.view')
ON CONFLICT DO NOTHING;

-- ─── 3. CLIENTS (student / alumni / teacher portal accounts) ─────────────────

INSERT INTO clients (cin, username, full_name, email, phone, client_type, is_active, password_hash, created_by)
VALUES
  ('ST001', 'ahmed.benali',   'Ahmed Ben Ali',     'ahmed.benali@iset.tn',    '+21655123456', 'student', true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('ST002', 'fatma.trabelsi', 'Fatma Trabelsi',    'fatma.trabelsi@iset.tn', '+21655234567', 'student', true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('ST003', 'rami.kouki',     'Rami Kouki',        'rami.kouki@iset.tn',     '+21655345678', 'student', false, '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('ST004', 'nour.hamdi',     'Nour Hamdi',        'nour.hamdi@iset.tn',     '+21655456789', 'student', true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('ST005', 'yassine.guedri', 'Yassine Guedri',    'yassine.guedri@iset.tn', '+21655567890', 'student', true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('AL001', 'mohamed.jlassi', 'Mohamed Jlassi',    'mohamed.jlassi@iset.tn', '+21656123456', 'alumni',  true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('AL002', 'sarra.boukadida','Sarra Boukadida',   'sarra.boukadida@iset.tn','+21656234567', 'alumni',  true,  '$2a$10$2HLanuqzHBQYorsaNnCQl.suHE5eN13KZWy.1hTIn.0WrQuj.sC9i', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('TC001', 'leila.bouazizi', 'Leila Bouazizi',    'leila.bouazizi@iset.tn', '+21657123456', 'teacher', true,  '$2a$10$XCjTxGZXQzbxKu1BHc/inuWWULEeH/CiMuerCHRKj3W0iH9Fr5UbG', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (cin) DO NOTHING;

-- ─── 4. DYNAMIC TABLES (created by data import) ──────────────────────────────

-- Table: dyn_students (student registry)
CREATE TABLE IF NOT EXISTS dyn_students (
  id SERIAL PRIMARY KEY,
  cin TEXT,
  full_name TEXT,
  department TEXT,
  enrollment_year INTEGER,
  gpa NUMERIC(4,2),
  is_active BOOLEAN DEFAULT true,
  _imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO dyn_students (cin, full_name, department, enrollment_year, gpa, is_active) VALUES
  ('ST001', 'Ahmed Ben Ali',      'Informatique',    2022, 14.75, true),
  ('ST002', 'Fatma Trabelsi',     'Informatique',    2022, 16.20, true),
  ('ST003', 'Rami Kouki',         'Electrique',      2021, 11.50, false),
  ('ST004', 'Nour Hamdi',         'Informatique',    2023, 13.80, true),
  ('ST005', 'Yassine Guedri',     'Gestion',         2022, 12.90, true),
  ('ST006', 'Amina Khelifi',      'Electrique',      2023, 15.40, true),
  ('ST007', 'Bilel Maalej',       'Informatique',    2021, 17.10, true),
  ('ST008', 'Chaima Sassi',       'Gestion',         2023, 10.80, true),
  ('ST009', 'Dhia Bouazizi',      'Informatique',    2022, 14.30, true),
  ('ST010', 'Emna Gharbi',        'Electrique',      2021, 13.60, true),
  ('ST011', 'Fares Kamoun',       'Gestion',         2022, 16.50, true),
  ('ST012', 'Ghada Trabelsi',     'Informatique',    2023, 12.10, true),
  ('ST013', 'Hassen Jebali',      'Electrique',      2022, 15.00, true),
  ('ST014', 'Ines Maatouk',       'Gestion',         2021, 11.90, true),
  ('ST015', 'Jaber Boukadida',    'Informatique',    2023, 14.60, true),
  ('ST016', 'Khawla Ben Salem',   'Electrique',      2022, 13.20, true),
  ('ST017', 'Lotfi Ghanmi',       'Gestion',         2021, 16.80, true),
  ('ST018', 'Marwa Hamdi',        'Informatique',    2023, 12.50, true),
  ('ST019', 'Nabil Jlassi',       'Electrique',      2022, 14.00, true),
  ('ST020', 'Oussama Khmiri',     'Gestion',         2021, 15.30, true),
  ('ST021', 'Pelrine Mnif',       'Informatique',    2022, 11.70, true),
  ('ST022', 'Qssais Bousetta',    'Electrique',      2023, 13.90, true),
  ('ST023', 'Rim Chaabane',       'Gestion',         2022, 16.00, true),
  ('ST024', 'Sami Ben Ammar',     'Informatique',    2021, 14.40, true),
  ('ST025', 'Tarek Zammeli',      'Electrique',      2023, 12.70, true),
  ('ST026', 'Umayma Kbaili',      'Gestion',         2022, 15.60, true),
  ('ST027', 'Wassim Dridi',       'Informatique',    2021, 17.30, true),
  ('ST028', 'Yosr Maalej',        'Electrique',      2023, 13.10, true),
  ('ST029', 'Zaineb Bouazizi',    'Gestion',         2022, 14.80, true),
  ('ST030', 'Achref Ben Ali',     'Informatique',    2021, 12.30, true),
  ('ST031', 'Basma Trabelsi',     'Electrique',      2022, 15.70, true),
  ('ST032', 'Chokri Gharbi',      'Gestion',         2023, 11.40, true),
  ('ST033', 'Dorsaf Kamoun',      'Informatique',    2021, 16.90, true),
  ('ST034', 'Essia Jebali',       'Electrique',      2022, 13.50, true),
  ('ST035', 'Firas Boukadida',    'Gestion',         2023, 14.10, true),
  ('ST036', 'Ghofrane Ben Salem', 'Informatique',    2021, NULL,  true),
  ('ST037', 'Hatem Ghanmi',       'Electrique',      2022, NULL,  true),
  ('ST038', 'Islem Khmiri',       'Gestion',         2023, 10.50, true),
  ('ST039', 'Jihen Mnif',         'Informatique',    2021, 15.20, true),
  ('ST040', 'Khalil Bousetta',    'Electrique',      2022, 12.80, true),
  ('AL001', 'Mohamed Jlassi',     'Informatique',    2019, 14.50, true),
  ('AL002', 'Sarra Boukadida',    'Gestion',         2020, 16.10, true),
  ('AL003', 'Aymen Khelifi',      'Electrique',      2018, 13.70, true),
  ('AL004', 'Badra Maalej',       'Informatique',    2019, 15.90, true),
  ('AL005', 'Chiraz Sassi',       'Gestion',         2020, 12.60, true),
  ('AL006', 'Dhafer Zammeli',     'Electrique',      2018, 17.40, true),
  ('AL007', 'Emna Dridi',         'Informatique',    2019, 14.20, true),
  ('AL008', 'Fethi Kbaili',       'Gestion',         2020, 11.80, true),
  ('AL009', 'Ghazi Bouazizi',     'Electrique',      2018, 16.30, true),
  ('AL010', 'Hayet Ben Ammar',    'Informatique',    2019, 13.40, true);

-- Table: dyn_grades (grade records)
CREATE TABLE IF NOT EXISTS dyn_grades (
  id SERIAL PRIMARY KEY,
  student_cin TEXT,
  subject TEXT,
  grade NUMERIC(5,2),
  semester TEXT,
  year INTEGER,
  _imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO dyn_grades (student_cin, subject, grade, semester, year) VALUES
  ('ST001', 'Algorithmique',          15.50, 'S1', 2022),
  ('ST001', 'Bases de donnees',       14.00, 'S1', 2022),
  ('ST001', 'Programmation C',        16.00, 'S1', 2022),
  ('ST001', 'Reseaux',                13.50, 'S2', 2022),
  ('ST001', 'Systemes d exploitation', 14.75, 'S2', 2022),
  ('ST002', 'Algorithmique',          17.00, 'S1', 2022),
  ('ST002', 'Bases de donnees',       16.50, 'S1', 2022),
  ('ST002', 'Programmation C',        15.00, 'S1', 2022),
  ('ST002', 'Reseaux',                18.00, 'S2', 2022),
  ('ST002', 'Systemes d exploitation', 14.50, 'S2', 2022),
  ('ST003', 'Electronique',           11.00, 'S1', 2021),
  ('ST003', 'Electrotechnique',       12.50, 'S1', 2021),
  ('ST003', 'Mathematiques',          10.00, 'S2', 2021),
  ('ST003', 'Automatique',            12.50, 'S2', 2021),
  ('ST004', 'Algorithmique',          13.50, 'S1', 2023),
  ('ST004', 'Bases de donnees',       14.00, 'S1', 2023),
  ('ST004', 'Programmation C',        14.00, 'S1', 2023),
  ('ST005', 'Comptabilite',           12.00, 'S1', 2022),
  ('ST005', 'Economie',               14.00, 'S1', 2022),
  ('ST005', 'Statistiques',           12.50, 'S2', 2022),
  ('ST005', 'Gestion financiere',     13.25, 'S2', 2022),
  ('ST006', 'Electronique',           16.00, 'S1', 2023),
  ('ST006', 'Electrotechnique',       15.00, 'S1', 2023),
  ('ST006', 'Mathematiques',          15.25, 'S2', 2023),
  ('ST007', 'Algorithmique',          18.00, 'S1', 2021),
  ('ST007', 'Bases de donnees',       17.50, 'S1', 2021),
  ('ST007', 'Programmation C',        16.00, 'S1', 2021),
  ('ST007', 'Reseaux',                17.00, 'S2', 2021),
  ('ST007', 'Systemes d exploitation', 17.00, 'S2', 2021),
  ('ST008', 'Comptabilite',           10.50, 'S1', 2023),
  ('ST008', 'Economie',               11.00, 'S1', 2023),
  ('ST008', 'Statistiques',           11.00, 'S2', 2023),
  ('ST009', 'Algorithmique',          15.00, 'S1', 2022),
  ('ST009', 'Bases de donnees',       14.00, 'S1', 2022),
  ('ST009', 'Programmation C',        14.00, 'S2', 2022),
  ('ST010', 'Electronique',           13.50, 'S1', 2021),
  ('ST010', 'Electrotechnique',       14.00, 'S1', 2021),
  ('ST010', 'Mathematiques',          13.25, 'S2', 2021),
  ('ST011', 'Comptabilite',           17.00, 'S1', 2022),
  ('ST011', 'Economie',               16.50, 'S1', 2022),
  ('ST011', 'Statistiques',           16.00, 'S2', 2022),
  ('ST012', 'Algorithmique',          12.50, 'S1', 2023),
  ('ST012', 'Bases de donnees',       11.50, 'S1', 2023),
  ('ST013', 'Electronique',           15.00, 'S1', 2022),
  ('ST013', 'Electrotechnique',       15.50, 'S1', 2022),
  ('ST014', 'Comptabilite',           12.00, 'S1', 2021),
  ('ST014', 'Economie',               11.50, 'S1', 2021),
  ('ST015', 'Algorithmique',          15.00, 'S1', 2023),
  ('ST015', 'Bases de donnees',       14.50, 'S1', 2023),
  ('ST016', 'Electronique',           13.00, 'S1', 2022),
  ('ST016', 'Electrotechnique',       13.50, 'S1', 2022),
  ('ST017', 'Comptabilite',           17.50, 'S1', 2021),
  ('ST017', 'Economie',               16.00, 'S1', 2021),
  ('ST018', 'Algorithmique',          13.00, 'S1', 2023),
  ('ST018', 'Bases de donnees',       12.00, 'S1', 2023),
  ('ST019', 'Electronique',           14.00, 'S1', 2022),
  ('ST019', 'Electrotechnique',       14.50, 'S1', 2022),
  ('ST020', 'Comptabilite',           15.50, 'S1', 2021),
  ('ST020', 'Economie',               15.00, 'S1', 2021),
  ('AL001', 'Algorithmique',          14.00, 'S1', 2019),
  ('AL001', 'Bases de donnees',       15.00, 'S1', 2019),
  ('AL001', 'Programmation C',        14.50, 'S1', 2019),
  ('AL001', 'Reseaux',                14.50, 'S2', 2019),
  ('AL002', 'Comptabilite',           16.50, 'S1', 2020),
  ('AL002', 'Economie',               16.00, 'S1', 2020),
  ('AL002', 'Statistiques',           15.50, 'S2', 2020),
  ('AL003', 'Electronique',           13.50, 'S1', 2018),
  ('AL003', 'Electrotechnique',       14.00, 'S1', 2018),
  ('AL003', 'Mathematiques',          13.50, 'S2', 2018),
  ('AL004', 'Algorithmique',          16.00, 'S1', 2019),
  ('AL004', 'Bases de donnees',       16.00, 'S1', 2019),
  ('AL005', 'Comptabilite',           12.50, 'S1', 2020),
  ('AL005', 'Economie',               12.50, 'S1', 2020),
  ('AL006', 'Electronique',           17.50, 'S1', 2018),
  ('AL006', 'Electrotechnique',       17.50, 'S1', 2018),
  ('AL006', 'Mathematiques',          17.00, 'S2', 2018),
  ('AL007', 'Algorithmique',          14.00, 'S1', 2019),
  ('AL007', 'Bases de donnees',       14.50, 'S1', 2019),
  ('AL008', 'Comptabilite',           11.50, 'S1', 2020),
  ('AL008', 'Economie',               12.00, 'S1', 2020),
  ('AL009', 'Electronique',           16.50, 'S1', 2018),
  ('AL009', 'Electrotechnique',       16.00, 'S1', 2018),
  ('AL010', 'Algorithmique',          13.50, 'S1', 2019),
  ('ST021', 'Algorithmique',          12.00, 'S1', 2022),
  ('ST022', 'Electronique',           14.00, 'S1', 2023),
  ('ST023', 'Comptabilite',           16.50, 'S1', 2022),
  ('ST023', 'Economie',               15.50, 'S2', 2022),
  ('ST024', 'Algorithmique',          14.50, 'S1', 2021),
  ('ST025', 'Electronique',           12.50, 'S1', 2023),
  ('ST026', 'Comptabilite',           15.50, 'S1', 2022),
  ('ST027', 'Algorithmique',          18.00, 'S1', 2021),
  ('ST027', 'Bases de donnees',       17.00, 'S1', 2021),
  ('ST027', 'Programmation C',        17.00, 'S1', 2021),
  ('ST028', 'Electronique',           13.00, 'S1', 2023),
  ('ST029', 'Comptabilite',           15.00, 'S1', 2022),
  ('ST030', 'Algorithmique',          12.50, 'S1', 2021),
  ('ST031', 'Electronique',           16.00, 'S1', 2022),
  ('ST032', 'Comptabilite',           11.00, 'S1', 2023),
  ('ST033', 'Algorithmique',          17.50, 'S1', 2021),
  ('ST034', 'Electronique',           13.50, 'S1', 2022),
  ('ST035', 'Comptabilite',           14.50, 'S1', 2023),
  ('ST036', 'Algorithmique',          14.00, 'S1', 2021),
  ('ST037', 'Electronique',           12.00, 'S1', 2022),
  ('ST038', 'Comptabilite',           10.50, 'S1', 2023),
  ('ST039', 'Algorithmique',          15.50, 'S1', 2021),
  ('ST040', 'Electronique',           13.00, 'S1', 2022);

-- Table: dyn_departments (lookup table for FK testing)
CREATE TABLE IF NOT EXISTS dyn_departments (
  id SERIAL PRIMARY KEY,
  dept_code TEXT,
  dept_name TEXT,
  head_name TEXT,
  student_count INTEGER,
  _imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO dyn_departments (dept_code, dept_name, head_name, student_count) VALUES
  ('INFO', 'Informatique',    'Dr. Moncef Ghanmi',   180),
  ('ELEC', 'Electrique',      'Dr. Leila Bouazizi',  120),
  ('GEST', 'Gestion',         'Prof. Hedi Maatouk',  95);

-- ─── 5. DATASETS REGISTRY ────────────────────────────────────────────────────

INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by) VALUES
  ('Students',     'students.csv',     'dyn_students',    'imported', 50,
   '[{"originalHeader":"CIN","columnName":"cin","columnType":"TEXT"},{"originalHeader":"Full Name","columnName":"full_name","columnType":"TEXT"},{"originalHeader":"Department","columnName":"department","columnType":"TEXT"},{"originalHeader":"Enrollment Year","columnName":"enrollment_year","columnType":"INTEGER"},{"originalHeader":"GPA","columnName":"gpa","columnType":"NUMERIC"},{"originalHeader":"Is Active","columnName":"is_active","columnType":"BOOLEAN"}]',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Grades',       'grades.csv',       'dyn_grades',      'imported', 100,
   '[{"originalHeader":"Student CIN","columnName":"student_cin","columnType":"TEXT"},{"originalHeader":"Subject","columnName":"subject","columnType":"TEXT"},{"originalHeader":"Grade","columnName":"grade","columnType":"NUMERIC"},{"originalHeader":"Semester","columnName":"semester","columnType":"TEXT"},{"originalHeader":"Year","columnName":"year","columnType":"INTEGER"}]',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Departments',  'departments.csv',  'dyn_departments', 'imported', 3,
   '[{"originalHeader":"Dept Code","columnName":"dept_code","columnType":"TEXT"},{"originalHeader":"Dept Name","columnName":"dept_name","columnType":"TEXT"},{"originalHeader":"Head Name","columnName":"head_name","columnType":"TEXT"},{"originalHeader":"Student Count","columnName":"student_count","columnType":"INTEGER"}]',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Pending Survey Data', 'survey_responses.csv', NULL, 'uploaded', 0, '[]',
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),
  ('Failed Import', 'corrupted_data.csv', NULL, 'error', 0, '[]',
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

-- ─── 6. CHARTS ───────────────────────────────────────────────────────────────

INSERT INTO charts (title, chart_type, dataset_id, config, created_by) VALUES
  ('Students by Department', 'bar',
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   '{"xColumn":"department","yColumn":"id","aggregation":"COUNT","showLegend":true,"showGrid":true,"showValues":true,"colorScheme":"ocean","legendPosition":"top"}',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Average GPA by Department', 'pie',
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   '{"xColumn":"department","yColumn":"gpa","aggregation":"AVG","showLegend":true,"colorScheme":"forest"}',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Grade Distribution by Year', 'line',
   (SELECT id FROM datasets WHERE table_name='dyn_grades'),
   '{"xColumn":"year","yColumn":"grade","aggregation":"AVG","showLegend":true,"showGrid":true,"tension":0.3,"colorScheme":"sunset"}',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Top Students by GPA', 'horizontalBar',
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   '{"xColumn":"full_name","yColumn":"gpa","aggregation":"MAX","showValues":true,"colorScheme":"lavender"}',
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Grade Breakdown by Semester', 'doughnut',
   (SELECT id FROM datasets WHERE table_name='dyn_grades'),
   '{"xColumn":"semester","yColumn":"grade","aggregation":"AVG","colorScheme":"pastel"}',
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Department Student Radar', 'radar',
   (SELECT id FROM datasets WHERE table_name='dyn_departments'),
   '{"xColumn":"dept_name","yColumn":"student_count","aggregation":"SUM","colorScheme":"vibrant"}',
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Student Enrollment Trend', 'area',
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   '{"xColumn":"enrollment_year","yColumn":"id","aggregation":"COUNT","fill":true,"tension":0.4,"colorScheme":"earth"}',
   (SELECT id FROM users WHERE email='teacher@iset-tozeur.tn')),

  ('AI Query: Department Count', 'bar',
   NULL,
   '{"sql":"SELECT department, COUNT(*) as count FROM \"dyn_students\" GROUP BY department","labelCol":"department","valueCol":"count","showLegend":false,"colorScheme":"ocean"}',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Active vs Inactive Students', 'polarArea',
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   '{"xColumn":"is_active","yColumn":"id","aggregation":"COUNT","colorScheme":"mono"}',
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'));

-- ─── 7. DASHBOARDS ───────────────────────────────────────────────────────────

INSERT INTO dashboards (title, description, layout, is_public, created_by) VALUES
  ('Student Performance Overview',
   'Comprehensive view of student data including enrollment, GPA distribution, and department statistics',
   '[]'::jsonb,
   true,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Academic Analytics',
   'Advanced analytics dashboard with grade trends and performance metrics',
   '[]'::jsonb,
   false,
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Department Insights',
   'Department-level metrics and comparisons',
   '[]'::jsonb,
   true,
   (SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'));

-- Add chart layout items to dashboards (using chart IDs from above)
-- Uses CTE to compute row positions, then aggregates into JSON layout
WITH ranked AS (
  SELECT id as chartId, (ROW_NUMBER() OVER (ORDER BY id) - 1) * 4 as y
  FROM charts WHERE title IN ('Students by Department', 'Average GPA by Department', 'Grade Distribution by Year', 'Active vs Inactive Students')
)
UPDATE dashboards SET layout = (
  SELECT jsonb_agg(jsonb_build_object('chartId', chartId, 'x', 0, 'y', y, 'w', 6, 'h', 4)) FROM ranked
)
WHERE title = 'Student Performance Overview';

WITH ranked AS (
  SELECT id as chartId,
    CASE WHEN (ROW_NUMBER() OVER (ORDER BY id) - 1) % 2 = 0 THEN 0 ELSE 6 END as x,
    ((ROW_NUMBER() OVER (ORDER BY id) - 1) / 2) * 4 as y
  FROM charts WHERE title IN ('Top Students by GPA', 'Grade Breakdown by Semester', 'Department Student Radar', 'Student Enrollment Trend')
)
UPDATE dashboards SET layout = (
  SELECT jsonb_agg(jsonb_build_object('chartId', chartId, 'x', x, 'y', y, 'w', 6, 'h', 4)) FROM ranked
)
WHERE title = 'Academic Analytics';

WITH ranked AS (
  SELECT id as chartId, (ROW_NUMBER() OVER (ORDER BY id) - 1) * 4 as y
  FROM charts WHERE title IN ('AI Query: Department Count', 'Students by Department')
)
UPDATE dashboards SET layout = (
  SELECT jsonb_agg(jsonb_build_object('chartId', chartId, 'x', 0, 'y', y, 'w', 12, 'h', 4)) FROM ranked
)
WHERE title = 'Department Insights';

-- ─── 8. FOREIGN KEYS (logical relationships) ─────────────────────────────────

INSERT INTO foreign_keys (source_table, source_column, target_table, target_column, created_by) VALUES
  ('dyn_grades', 'student_cin', 'dyn_students', 'cin', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('dyn_students', 'department', 'dyn_departments', 'dept_name', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (source_table, source_column, target_table, target_column) DO NOTHING;

-- ─── 9. SAVED QUERIES ────────────────────────────────────────────────────────

INSERT INTO saved_queries (title, sql, description, is_public, created_by) VALUES
  ('All Active Students',
   'SELECT * FROM "dyn_students" WHERE is_active = true ORDER BY gpa DESC',
   'List of all currently active students sorted by GPA',
   true,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Average Grade by Subject',
   'SELECT subject, ROUND(AVG(grade), 2) as avg_grade, COUNT(*) as count FROM "dyn_grades" GROUP BY subject ORDER BY avg_grade DESC',
   'Average grade per subject across all semesters',
   true,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Students Needing Support',
   'SELECT s.cin, s.full_name, s.department, ROUND(AVG(g.grade), 2) as avg_grade FROM "dyn_students" s JOIN "dyn_grades" g ON s.cin = g.student_cin GROUP BY s.cin, s.full_name, s.department HAVING AVG(g.grade) < 12 ORDER BY avg_grade ASC',
   'Students with average grade below passing threshold (12/20)',
   false,
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Department Enrollment Trends',
   'SELECT department, enrollment_year, COUNT(*) as student_count FROM "dyn_students" GROUP BY department, enrollment_year ORDER BY department, enrollment_year',
   'Year-over-year enrollment numbers by department',
   false,
   (SELECT id FROM users WHERE email='analyst@iset-tozeur.tn')),

  ('Grade Distribution Summary',
   'SELECT CASE WHEN grade >= 16 THEN ''Excellent'' WHEN grade >= 14 THEN ''Good'' WHEN grade >= 12 THEN ''Passing'' WHEN grade >= 10 THEN ''Below Average'' ELSE ''Failing'' END as grade_band, COUNT(*) as count FROM "dyn_grades" GROUP BY grade_band ORDER BY MIN(grade) DESC',
   'Distribution of grades across performance bands',
   true,
   (SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'));

-- ─── 10. SURVEYS ─────────────────────────────────────────────────────────────

INSERT INTO surveys (user_id, title, description, goal, schema) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'),
   'Student Satisfaction Survey 2024',
   'Annual survey to evaluate student satisfaction with courses and facilities',
   'Evaluate student satisfaction with online learning experience at ISET Tozeur',
   '{"fields":[
     {"id":"f1","type":"text","label":"Full Name","required":true},
     {"id":"f2","type":"email","label":"Email Address","required":true},
     {"id":"f3","type":"select","label":"Department","required":true,"options":["Informatique","Electrique","Gestion"]},
     {"id":"f4","type":"rating","label":"Overall satisfaction (1-5)","required":true,"min":1,"max":5},
     {"id":"f5","type":"radio","label":"Would you recommend ISET Tozeur?","required":true,"options":["Yes","No","Maybe"]},
     {"id":"f6","type":"checkbox","label":"Which facilities need improvement?","required":false,"options":["Library","Labs","Cafeteria","WiFi","Classrooms"]},
     {"id":"f7","type":"textarea","label":"Additional comments","required":false},
     {"id":"f8","type":"number","label":"Hours of study per week","required":true},
     {"id":"f9","type":"date","label":"Expected graduation date","required":false}
   ]}'::jsonb),

  ((SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'),
   'Course Feedback — Algorithmique',
   'End-of-semester feedback for the Algorithmique course',
   'Gather student feedback on course content and teaching quality',
   '{"fields":[
     {"id":"f1","type":"text","label":"Student CIN","required":true},
     {"id":"f2","type":"rating","label":"Course content quality (1-5)","required":true,"min":1,"max":5},
     {"id":"f3","type":"rating","label":"Teaching clarity (1-5)","required":true,"min":1,"max":5},
     {"id":"f4","type":"radio","label":"Course difficulty","required":true,"options":["Too easy","Just right","Too difficult"]},
     {"id":"f5","type":"textarea","label":"What would you improve?","required":false},
     {"id":"f6","type":"checkbox","label":"Resources used","required":false,"options":["Textbook","Slides","Online tutorials","Study groups"]}
   ]}'::jsonb),

  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'),
   'Alumni Career Survey',
   'Track career outcomes for ISET Tozeur graduates',
   'Understand employment outcomes and career trajectories of alumni',
   '{"fields":[
     {"id":"f1","type":"text","label":"Full Name","required":true},
     {"id":"f2","type":"email","label":"Current Email","required":true},
     {"id":"f3","type":"select","label":"Current Employment Status","required":true,"options":["Employed","Self-employed","Unemployed","Further studies"]},
     {"id":"f4","type":"text","label":"Current Job Title","required":false},
     {"id":"f5","type":"number","label":"Years of Experience","required":true},
     {"id":"f6","type":"textarea","label":"How has ISET helped your career?","required":false}
   ]}'::jsonb);

-- ─── 11. REPORTS ─────────────────────────────────────────────────────────────

INSERT INTO reports (title, content, report_type, client_id, dataset_id, is_public, created_by) VALUES
  ('Performance Report — Ahmed Ben Ali (ST001)', E'# Performance Report\n\n**Student:** Ahmed Ben Ali (CIN: ST001)\n**Department:** Informatique\n**Period:** 2022-2023\n\n## Summary\n\nAhmed demonstrates solid academic performance with an overall average of **14.75/20**. He excels particularly in Algorithmique (15.50) and Programmation C (16.00), showing strong analytical and programming skills.\n\n## Subject Breakdown\n\n| Subject | Grade |\n|---------|-------|\n| Algorithmique | 15.50 |\n| Bases de donnees | 14.00 |\n| Programmation C | 16.00 |\n| Reseaux | 13.50 |\n| Systemes d exploitation | 14.75 |\n\n## Recommendations\n\n- Consider advanced networking courses to improve the Reseaux grade\n- Strong candidate for software development internship\n- Overall trajectory is positive', 'performance',
   (SELECT id FROM clients WHERE cin='ST001'),
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   false,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('Performance Report — Fatma Trabelsi (ST002)', E'# Performance Report\n\n**Student:** Fatma Trabelsi (CIN: ST002)\n**Department:** Informatique\n**Period:** 2022-2023\n\n## Summary\n\nFatma is a **high-achieving student** with an outstanding overall average of **16.20/20**. She consistently performs above 14.50 across all subjects, with particular excellence in Reseaux (18.00).\n\n## Subject Breakdown\n\n| Subject | Grade |\n|---------|-------|\n| Algorithmique | 17.00 |\n| Bases de donnees | 16.50 |\n| Programmation C | 15.00 |\n| Reseaux | 18.00 |\n| Systemes d exploitation | 14.50 |\n\n## Recommendations\n\n- Excellent candidate for graduate studies\n- Consider advanced network engineering certification\n- Could serve as peer tutor for Algorithmique and Reseaux', 'performance',
   (SELECT id FROM clients WHERE cin='ST002'),
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   false,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),

  ('ISET Tozeur — Annual Academic Report 2023', E'# ISET Tozeur — Rapport Academique Annuel 2023\n\n## Vue d Ensemble\n\nCe rapport presente une analyse des performances academiques de l institut pour l annee 2022-2023.\n\n## Statistiques Cles\n\n- **Nombre total d etudiants actifs:** 48\n- **Moyenne generale:** 14.02/20\n- **Taux de reussite (>= 10):** 96%\n- **Taux d excellence (>= 16):** 23%\n\n## Performance par Departement\n\n### Informatique\n- Moyenne: 14.68/20\n- Meilleur etudiant: Bilel Maalej (17.10)\n- Effectif: 18 etudiants\n\n### Electrique\n- Moyenne: 13.75/20\n- Meilleur etudiant: Amina Khelifi (15.40)\n- Effectif: 15 etudiants\n\n### Gestion\n- Moyenne: 13.65/20\n- Meilleur etudiant: Lotfi Ghanmi (16.80)\n- Effectif: 15 etudiants\n\n## Tendances\n\n- Amelioration constante des moyennes depuis 2021\n- Le departement Informatique maintient la meilleure moyenne\n- Le taux de diplomation est en hausse de 5% par rapport a 2022', 'annual',
   NULL,
   (SELECT id FROM datasets WHERE table_name='dyn_students'),
   true,
   (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'));

-- ─── 12. NOTIFICATIONS ───────────────────────────────────────────────────────

INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info',    'New dataset imported',        'The dataset "Students" has been successfully imported with 50 rows.',             true),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'success', 'Dashboard published',         'Dashboard "Student Performance Overview" has been published to the public portal.', true),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'warning', 'AI query rate limit',         'You have made 45 AI queries today. The daily limit is 50.',                        false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'error',   'Import failed',               'The import of "corrupted_data.csv" failed due to invalid CSV format.',             false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info',    'New client registered',       'Client "Ahmed Ben Ali" (ST001) has been added to the system.',                     false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info',    'Report generated',            'AI-generated performance report for student ST001 is ready.',                      false),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'info',   'New chart created',           'Your chart "Top Students by GPA" has been saved successfully.',                    false),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'warning','Query execution slow',        'Your saved query "Students Needing Support" took 3.2 seconds to execute.',         true),
  ((SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'), 'info',   'Survey responses available',  'Your "Course Feedback" survey has received 15 responses.',                         false),
  ((SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'), 'success','Client import completed',    'Bulk import of 5 clients completed successfully.',                                true);

-- ─── 13. AI QUERY AUDIT LOG ──────────────────────────────────────────────────

INSERT INTO ai_queries (user_id, question, created_at) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'),   'How many students are in each department?',                             NOW() - INTERVAL '2 days'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'),   'What is the average GPA across all departments?',                       NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'),   'Show me the top 10 students by GPA',                                    NOW() - INTERVAL '18 hours'),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'Which students have a GPA below 12?',                                   NOW() - INTERVAL '12 hours'),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'Compare enrollment numbers by year',                                     NOW() - INTERVAL '6 hours'),
  ((SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'), 'What are the average grades by subject for my department?',              NOW() - INTERVAL '3 hours'),
  ((SELECT id FROM users WHERE email='teacher@iset-tozeur.tn'), 'How many students are at risk of failing?',                              NOW() - INTERVAL '1 hour');

COMMIT;
