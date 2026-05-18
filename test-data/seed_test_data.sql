-- ============================================================
-- ISET Observatory - Comprehensive Test Data Seed Script
-- ============================================================
-- Usage: psql -h localhost -U observatory -d observatory_db -f seed_test_data.sql
-- Password: observatory_secret
-- ============================================================
-- NOTE: This script assumes migrations 001-013 have already run.
-- It uses ON CONFLICT DO NOTHING for idempotent inserts.
-- All CINs are 8-digit numbers (leading zeros preserved by VARCHAR).
-- ============================================================

BEGIN;

-- ============================================================
-- 1. STAFF USERS (5 users)
-- ============================================================
INSERT INTO users (email, password_hash, full_name, role, is_active, user_type, preferences)
VALUES
  ('admin@iset-tozeur.tn', '$2b$10$dummyhashedpassword1', 'Super Administrator', 'super_admin', true, 'staff', '{"theme":"default","language":"fr"}'),
  ('analyst@iset-tozeur.tn', '$2b$10$dummyhashedpassword2', 'Amira Khelifi', 'analyst', true, 'staff', '{"theme":"default","language":"fr"}'),
  ('viewer@iset-tozeur.tn', '$2b$10$dummyhashedpassword3', 'Khaled Bousetta', 'viewer', true, 'staff', '{}'),
  ('teacher@iset-tozeur.tn', '$2b$10$dummyhashedpassword4', 'Dr. Sami Bouaziz', 'admin', true, 'staff', '{"theme":"green","language":"fr"}'),
  ('inactive@iset-tozeur.tn', '$2b$10$dummyhashedpassword5', 'Mourad Inactif', 'viewer', false, 'staff', '{}')
ON CONFLICT (email) DO NOTHING;

-- Link staff users to roles
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'analyst@iset-tozeur.tn' AND r.name = 'analyst'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'viewer@iset-tozeur.tn' AND r.name = 'viewer'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'teacher@iset-tozeur.tn' AND r.name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Helper: admin user ID for foreign keys (use subqueries instead of hardcoded IDs)
-- All created_by fields use (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')

-- ============================================================
-- 2. CLIENT USERS (8 clients)
-- ============================================================
-- Passwords are bcrypt-hashed. For testing, the raw passwords are:
-- students: their CIN (e.g., 09727760)
-- alumni: "alumni2024"
-- teachers: "teacher2024"
INSERT INTO clients (cin, username, full_name, email, phone, client_type, is_active, password_hash, created_by)
VALUES
  ('09727760', 'ahmed.benali', 'Ahmed Ben Ali', 'ahmed.benali@iset.tn', '+216 98 111 222', 'student', true, '$2b$10$dummyclient1', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727761', 'fatma.trabelsi', 'Fatma Trabelsi', 'fatma.trabelsi@iset.tn', '+216 98 222 333', 'student', true, '$2b$10$dummyclient2', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727762', 'rami.kouki', 'Rami Kouki', NULL, '+216 98 333 444', 'student', true, '$2b$10$dummyclient3', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727763', 'nour.hamdi', 'Nour Hamdi', 'nour.hamdi@iset.tn', NULL, 'student', true, '$2b$10$dummyclient4', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727764', 'yassine.guedri', 'Yassine Guedri', 'yassine.guedri@gmail.com', '+216 98 444 555', 'alumni', true, '$2b$10$dummyclient5', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727765', 'amina.khelifi', 'Amina Khelifi', 'amina.khelifi@gmail.com', '+216 98 555 666', 'alumni', true, '$2b$10$dummyclient6', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727766', 'sami.bouaziz', 'Dr. Sami Bouaziz', 'sami.bouaziz@iset.tn', '+216 98 666 777', 'teacher', true, '$2b$10$dummyclient7', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('09727767', 'leila.gharbi', 'Dr. Leila Gharbi', 'leila.gharbi@iset.tn', '+216 98 777 888', 'teacher', true, '$2b$10$dummyclient8', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (cin) DO NOTHING;

-- ============================================================
-- 3. DYNAMIC DATA TABLES (via datasets + real tables)
-- ============================================================

-- 3a. Dataset: students (50 rows)
INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by)
VALUES ('Etudiants ISET', 'students.csv', 'data_students', 'imported', 50,
  '{"CIN":"text","Full Name":"text","Department":"text","Enrollment Year":"integer","GPA":"decimal","Is Active":"boolean"}',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_students (
  id SERIAL PRIMARY KEY,
  cin VARCHAR(50),
  full_name VARCHAR(255),
  department VARCHAR(100),
  enrollment_year INTEGER,
  gpa DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true
);

INSERT INTO data_students (cin, full_name, department, enrollment_year, gpa, is_active) VALUES
  ('09727720', 'Ahmed Ben Ali', 'Informatique', 2022, 14.75, true),
  ('09727721', 'Fatma Trabelsi', 'Informatique', 2022, 16.20, true),
  ('09727722', 'Rami Kouki', 'Electrique', 2021, 11.50, false),
  ('09727723', 'Nour Hamdi', 'Informatique', 2023, 13.80, true),
  ('09727724', 'Yassine Guedri', 'Gestion', 2022, 12.90, true),
  ('09727725', 'Amina Khelifi', 'Electrique', 2023, 15.40, true),
  ('09727726', 'Bilel Maalej', 'Informatique', 2021, 17.10, true),
  ('09727727', 'Chaima Sassi', 'Gestion', 2023, 10.80, true),
  ('09727728', 'Dhia Bouazizi', 'Informatique', 2022, 14.30, true),
  ('09727729', 'Emna Gharbi', 'Electrique', 2021, 13.60, true),
  ('09727730', 'Fares Kamoun', 'Gestion', 2022, 16.50, true),
  ('09727731', 'Ghada Trabelsi', 'Informatique', 2023, 12.10, true),
  ('09727732', 'Hassen Jebali', 'Electrique', 2022, 15.00, true),
  ('09727733', 'Ines Maatouk', 'Gestion', 2021, 11.90, true),
  ('09727734', 'Jaber Boukadida', 'Informatique', 2023, 14.60, true),
  ('09727735', 'Khawla Ben Salem', 'Electrique', 2022, 13.20, true),
  ('09727736', 'Lotfi Ghanmi', 'Gestion', 2021, 16.80, true),
  ('09727737', 'Marwa Hamdi', 'Informatique', 2023, 12.50, true),
  ('09727738', 'Nabil Jlassi', 'Electrique', 2022, 14.00, true),
  ('09727739', 'Oussama Khmiri', 'Gestion', 2021, 15.30, true),
  ('09727740', 'Pelrine Mnif', 'Informatique', 2022, 11.70, true),
  ('09727741', 'Qssais Bousetta', 'Electrique', 2023, 13.90, true),
  ('09727742', 'Rim Chaabane', 'Gestion', 2022, 16.00, true),
  ('09727743', 'Sami Ben Ammar', 'Informatique', 2021, 14.40, true),
  ('09727744', 'Tarek Zammeli', 'Electrique', 2023, 12.70, true),
  ('09727745', 'Umayma Kbaili', 'Gestion', 2022, 15.60, true),
  ('09727746', 'Wassim Dridi', 'Informatique', 2021, 17.30, true),
  ('09727747', 'Yosr Maalej', 'Electrique', 2023, 13.10, true),
  ('09727748', 'Zaineb Bouazizi', 'Gestion', 2022, 14.80, true),
  ('09727749', 'Achref Ben Ali', 'Informatique', 2021, 12.30, true),
  ('09727750', 'Basma Trabelsi', 'Electrique', 2022, 15.70, true),
  ('09727751', 'Chokri Gharbi', 'Gestion', 2023, 11.40, true),
  ('09727752', 'Dorsaf Kamoun', 'Informatique', 2021, 16.90, true),
  ('09727753', 'Essia Jebali', 'Electrique', 2022, 13.50, true),
  ('09727754', 'Firas Boukadida', 'Gestion', 2023, 14.10, true),
  ('09727755', 'Ghofrane Ben Salem', 'Informatique', 2021, NULL, true),
  ('09727756', 'Hatem Ghanmi', 'Electrique', 2022, NULL, true),
  ('09727757', 'Islem Khmiri', 'Gestion', 2023, 10.50, true),
  ('09727758', 'Jihen Mnif', 'Informatique', 2021, 15.20, true),
  ('09727759', 'Khalil Bousetta', 'Electrique', 2022, 12.80, true),
  ('09727710', 'Mohamed Jlassi', 'Informatique', 2019, 14.50, true),
  ('09727711', 'Sarra Boukadida', 'Gestion', 2020, 16.10, true),
  ('09727712', 'Aymen Khelifi', 'Electrique', 2018, 13.70, true),
  ('09727713', 'Badra Maalej', 'Informatique', 2019, 15.90, true),
  ('09727714', 'Chiraz Sassi', 'Gestion', 2020, 12.60, true),
  ('09727715', 'Dhafer Zammeli', 'Electrique', 2018, 17.40, true),
  ('09727716', 'Emna Dridi', 'Informatique', 2019, 14.20, true),
  ('09727717', 'Fethi Kbaili', 'Gestion', 2020, 11.80, true),
  ('09727718', 'Ghazi Bouazizi', 'Electrique', 2018, 16.30, true),
  ('09727719', 'Hayet Ben Ammar', 'Informatique', 2019, 13.40, true);

-- 3b. Dataset: grades (106 rows)
INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by)
VALUES ('Notes des etudiants', 'grades.csv', 'data_grades', 'imported', 106,
  '{"Student CIN":"text","Subject":"text","Grade":"decimal","Semester":"text","Year":"integer"}',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_grades (
  id SERIAL PRIMARY KEY,
  student_cin VARCHAR(50),
  subject VARCHAR(255),
  grade DECIMAL(5,2),
  semester VARCHAR(10),
  year INTEGER
);

INSERT INTO data_grades (student_cin, subject, grade, semester, year) VALUES
  ('09727720', 'Algorithmique', 15.50, 'S1', 2022),
  ('09727720', 'Bases de donnees', 14.00, 'S1', 2022),
  ('09727720', 'Programmation C', 16.00, 'S1', 2022),
  ('09727720', 'Reseaux', 13.50, 'S2', 2022),
  ('09727720', 'Systemes d exploitation', 14.75, 'S2', 2022),
  ('09727721', 'Algorithmique', 17.00, 'S1', 2022),
  ('09727721', 'Bases de donnees', 16.50, 'S1', 2022),
  ('09727721', 'Programmation C', 15.00, 'S1', 2022),
  ('09727721', 'Reseaux', 18.00, 'S2', 2022),
  ('09727721', 'Systemes d exploitation', 14.50, 'S2', 2022),
  ('09727722', 'Electronique', 11.00, 'S1', 2021),
  ('09727722', 'Electrotechnique', 12.50, 'S1', 2021),
  ('09727722', 'Mathematiques', 10.00, 'S2', 2021),
  ('09727722', 'Automatique', 12.50, 'S2', 2021),
  ('09727723', 'Algorithmique', 13.50, 'S1', 2023),
  ('09727723', 'Bases de donnees', 14.00, 'S1', 2023),
  ('09727723', 'Programmation C', 14.00, 'S1', 2023),
  ('09727724', 'Comptabilite', 12.00, 'S1', 2022),
  ('09727724', 'Economie', 14.00, 'S1', 2022),
  ('09727724', 'Statistiques', 12.50, 'S2', 2022),
  ('09727724', 'Gestion financiere', 13.25, 'S2', 2022),
  ('09727725', 'Electronique', 16.00, 'S1', 2023),
  ('09727725', 'Electrotechnique', 15.00, 'S1', 2023),
  ('09727725', 'Mathematiques', 15.25, 'S2', 2023),
  ('09727726', 'Algorithmique', 18.00, 'S1', 2021),
  ('09727726', 'Bases de donnees', 17.50, 'S1', 2021),
  ('09727726', 'Programmation C', 16.00, 'S1', 2021),
  ('09727726', 'Reseaux', 17.00, 'S2', 2021),
  ('09727726', 'Systemes d exploitation', 17.00, 'S2', 2021),
  ('09727727', 'Comptabilite', 10.50, 'S1', 2023),
  ('09727727', 'Economie', 11.00, 'S1', 2023),
  ('09727727', 'Statistiques', 11.00, 'S2', 2023),
  ('09727728', 'Algorithmique', 15.00, 'S1', 2022),
  ('09727728', 'Bases de donnees', 14.00, 'S1', 2022),
  ('09727728', 'Programmation C', 14.00, 'S2', 2022),
  ('09727729', 'Electronique', 13.50, 'S1', 2021),
  ('09727729', 'Electrotechnique', 14.00, 'S1', 2021),
  ('09727729', 'Mathematiques', 13.25, 'S2', 2021),
  ('09727730', 'Comptabilite', 17.00, 'S1', 2022),
  ('09727730', 'Economie', 16.50, 'S1', 2022),
  ('09727730', 'Statistiques', 16.00, 'S2', 2022),
  ('09727731', 'Algorithmique', 12.50, 'S1', 2023),
  ('09727731', 'Bases de donnees', 11.50, 'S1', 2023),
  ('09727732', 'Electronique', 15.00, 'S1', 2022),
  ('09727732', 'Electrotechnique', 15.50, 'S1', 2022),
  ('09727733', 'Comptabilite', 12.00, 'S1', 2021),
  ('09727733', 'Economie', 11.50, 'S1', 2021),
  ('09727734', 'Algorithmique', 15.00, 'S1', 2023),
  ('09727734', 'Bases de donnees', 14.50, 'S1', 2023),
  ('09727735', 'Electronique', 13.00, 'S1', 2022),
  ('09727735', 'Electrotechnique', 13.50, 'S1', 2022),
  ('09727736', 'Comptabilite', 17.50, 'S1', 2021),
  ('09727736', 'Economie', 16.00, 'S1', 2021),
  ('09727737', 'Algorithmique', 13.00, 'S1', 2023),
  ('09727737', 'Bases de donnees', 12.00, 'S1', 2023),
  ('09727738', 'Electronique', 14.00, 'S1', 2022),
  ('09727738', 'Electrotechnique', 14.50, 'S1', 2022),
  ('09727739', 'Comptabilite', 15.50, 'S1', 2021),
  ('09727739', 'Economie', 15.00, 'S1', 2021),
  ('09727710', 'Algorithmique', 14.00, 'S1', 2019),
  ('09727710', 'Bases de donnees', 15.00, 'S1', 2019),
  ('09727710', 'Programmation C', 14.50, 'S1', 2019),
  ('09727710', 'Reseaux', 14.50, 'S2', 2019),
  ('09727711', 'Comptabilite', 16.50, 'S1', 2020),
  ('09727711', 'Economie', 16.00, 'S1', 2020),
  ('09727711', 'Statistiques', 15.50, 'S2', 2020),
  ('09727712', 'Electronique', 13.50, 'S1', 2018),
  ('09727712', 'Electrotechnique', 14.00, 'S1', 2018),
  ('09727712', 'Mathematiques', 13.50, 'S2', 2018),
  ('09727713', 'Algorithmique', 16.00, 'S1', 2019),
  ('09727713', 'Bases de donnees', 16.00, 'S1', 2019),
  ('09727714', 'Comptabilite', 12.50, 'S1', 2020),
  ('09727714', 'Economie', 12.50, 'S1', 2020),
  ('09727715', 'Electronique', 17.50, 'S1', 2018),
  ('09727715', 'Electrotechnique', 17.50, 'S1', 2018),
  ('09727715', 'Mathematiques', 17.00, 'S2', 2018),
  ('09727716', 'Algorithmique', 14.00, 'S1', 2019),
  ('09727716', 'Bases de donnees', 14.50, 'S1', 2019),
  ('09727717', 'Comptabilite', 11.50, 'S1', 2020),
  ('09727717', 'Economie', 12.00, 'S1', 2020),
  ('09727718', 'Electronique', 16.50, 'S1', 2018),
  ('09727718', 'Electrotechnique', 16.00, 'S1', 2018),
  ('09727719', 'Algorithmique', 13.50, 'S1', 2019),
  ('09727740', 'Algorithmique', 12.00, 'S1', 2022),
  ('09727741', 'Electronique', 14.00, 'S1', 2023),
  ('09727742', 'Comptabilite', 16.50, 'S1', 2022),
  ('09727742', 'Economie', 15.50, 'S2', 2022),
  ('09727743', 'Algorithmique', 14.50, 'S1', 2021),
  ('09727744', 'Electronique', 12.50, 'S1', 2023),
  ('09727745', 'Comptabilite', 15.50, 'S1', 2022),
  ('09727746', 'Algorithmique', 18.00, 'S1', 2021),
  ('09727746', 'Bases de donnees', 17.00, 'S1', 2021),
  ('09727746', 'Programmation C', 17.00, 'S1', 2021),
  ('09727747', 'Electronique', 13.00, 'S1', 2023),
  ('09727748', 'Comptabilite', 15.00, 'S1', 2022),
  ('09727749', 'Algorithmique', 12.50, 'S1', 2021),
  ('09727750', 'Electronique', 16.00, 'S1', 2022),
  ('09727751', 'Comptabilite', 11.00, 'S1', 2023),
  ('09727752', 'Algorithmique', 17.50, 'S1', 2021),
  ('09727753', 'Electronique', 13.50, 'S1', 2022),
  ('09727754', 'Comptabilite', 14.50, 'S1', 2023),
  ('09727755', 'Algorithmique', 14.00, 'S1', 2021),
  ('09727756', 'Electronique', 12.00, 'S1', 2022),
  ('09727757', 'Comptabilite', 10.50, 'S1', 2023),
  ('09727758', 'Algorithmique', 15.50, 'S1', 2021),
  ('09727759', 'Electronique', 13.00, 'S1', 2022);

-- 3c. Dataset: departments (3 rows)
INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by)
VALUES ('Departements ISET', 'departments.csv', 'data_departments', 'imported', 3,
  '{"Code":"text","Name":"text","Head":"text","Students Count":"integer","Established Year":"integer","Accreditation":"text"}',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_departments (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10),
  name VARCHAR(100),
  head VARCHAR(255),
  students_count INTEGER,
  established_year INTEGER,
  accreditation VARCHAR(10)
);

INSERT INTO data_departments (code, name, head, students_count, established_year, accreditation) VALUES
  ('INF', 'Informatique', 'Dr. Sami Bouaziz', 180, 2005, 'Oui'),
  ('ELC', 'Electrique', 'Dr. Monia Jebali', 120, 2005, 'Oui'),
  ('GES', 'Gestion', 'Dr. Leila Gharbi', 150, 2007, 'Oui');

-- 3d. Dataset: courses_results (16 rows)
INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by)
VALUES ('Resultats des cours', 'courses_results.csv', 'data_courses_results', 'imported', 16,
  '{"Course Code":"text","Course Name":"text","Department":"text","Semester":"text","Year":"integer","Instructor":"text","Enrolled":"integer","Passed":"integer","Failed":"integer","Average Grade":"decimal","Pass Rate":"decimal"}',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_courses_results (
  id SERIAL PRIMARY KEY,
  course_code VARCHAR(20),
  course_name VARCHAR(255),
  department VARCHAR(100),
  semester VARCHAR(10),
  year INTEGER,
  instructor VARCHAR(255),
  enrolled INTEGER,
  passed INTEGER,
  failed INTEGER,
  average_grade DECIMAL(5,2),
  pass_rate DECIMAL(5,2)
);

INSERT INTO data_courses_results (course_code, course_name, department, semester, year, instructor, enrolled, passed, failed, average_grade, pass_rate) VALUES
  ('CS101', 'Introduction a la programmation', 'Informatique', 'S1', 2025, 'Dr. Sami Bouaziz', 45, 38, 7, 12.40, 84.40),
  ('CS201', 'Structures de donnees', 'Informatique', 'S1', 2025, 'Dr. Sami Bouaziz', 38, 30, 8, 11.80, 78.90),
  ('CS301', 'Bases de donnees', 'Informatique', 'S2', 2025, 'Dr. Amira Khelifi', 42, 35, 7, 13.10, 83.30),
  ('CS401', 'Reseaux informatiques', 'Informatique', 'S2', 2025, 'Dr. Khaled Bousetta', 35, 28, 7, 11.20, 80.00),
  ('CS501', 'Intelligence artificielle', 'Informatique', 'S1', 2024, 'Dr. Sami Bouaziz', 30, 22, 8, 10.50, 73.30),
  ('EL101', 'Circuits electriques', 'Electrique', 'S1', 2025, 'Dr. Monia Jebali', 40, 32, 8, 11.60, 80.00),
  ('EL201', 'Electrotechnique', 'Electrique', 'S2', 2025, 'Dr. Monia Jebali', 38, 30, 8, 12.00, 78.90),
  ('EL301', 'Automatique', 'Electrique', 'S1', 2024, 'Dr. Hassen Maalej', 35, 25, 10, 10.80, 71.40),
  ('EL401', 'Electronique de puissance', 'Electrique', 'S2', 2024, 'Dr. Hassen Maalej', 32, 24, 8, 11.50, 75.00),
  ('GE101', 'Comptabilite generale', 'Gestion', 'S1', 2025, 'Dr. Leila Gharbi', 48, 40, 8, 12.80, 83.30),
  ('GE201', 'Economie d entreprise', 'Gestion', 'S1', 2025, 'Dr. Leila Gharbi', 45, 38, 7, 13.20, 84.40),
  ('GE301', 'Statistiques', 'Gestion', 'S2', 2025, 'Dr. Nabil Dridi', 42, 34, 8, 11.90, 81.00),
  ('GE401', 'Gestion financiere', 'Gestion', 'S2', 2024, 'Dr. Nabil Dridi', 40, 30, 10, 10.70, 75.00),
  ('CS102', 'Programmation C', 'Informatique', 'S1', 2025, 'Dr. Amira Khelifi', 45, 36, 9, 11.50, 80.00),
  ('CS202', 'Developpement web', 'Informatique', 'S2', 2025, 'Dr. Amira Khelifi', 40, 33, 7, 13.00, 82.50),
  ('CS302', 'Systemes d exploitation', 'Informatique', 'S2', 2024, 'Dr. Khaled Bousetta', 36, 26, 10, 10.30, 72.20);

-- 3e. Dataset: alumni_employment (12 rows)
INSERT INTO datasets (name, file_name, table_name, status, row_count, column_mapping, uploaded_by)
VALUES ('Emploi des diplomes', 'alumni_employment.csv', 'data_alumni_employment', 'imported', 12,
  '{"CIN":"text","Full Name":"text","Graduation Year":"integer","Department":"text","Degree":"text","Current Employer":"text","Job Title":"text","Sector":"text","Monthly Salary":"integer","City":"text","Months to First Job":"integer","Satisfied":"text"}',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (table_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS data_alumni_employment (
  id SERIAL PRIMARY KEY,
  cin VARCHAR(50),
  full_name VARCHAR(255),
  graduation_year INTEGER,
  department VARCHAR(100),
  degree VARCHAR(50),
  current_employer VARCHAR(255),
  job_title VARCHAR(255),
  sector VARCHAR(100),
  monthly_salary INTEGER,
  city VARCHAR(100),
  months_to_first_job INTEGER,
  satisfied VARCHAR(10)
);

INSERT INTO data_alumni_employment (cin, full_name, graduation_year, department, degree, current_employer, job_title, sector, monthly_salary, city, months_to_first_job, satisfied) VALUES
  ('09727710', 'Mohamed Jlassi', 2019, 'Informatique', 'Licence', 'Vermeg', 'Software Developer', 'IT', 2800, 'Tunis', 3, 'Yes'),
  ('09727711', 'Sarra Boukadida', 2020, 'Gestion', 'Licence', 'Banque de Tunisie', 'Account Manager', 'Banking', 2200, 'Tunis', 6, 'Yes'),
  ('09727712', 'Aymen Khelifi', 2018, 'Electrique', 'Licence', 'STEG', 'Electrical Engineer', 'Energy', 2400, 'Sfax', 2, 'Yes'),
  ('09727714', 'Chiraz Sassi', 2020, 'Gestion', 'Licence', 'Carrefour', 'Store Manager', 'Retail', 1800, 'Tunis', 8, 'No'),
  ('09727715', 'Dhafer Zammeli', 2018, 'Electrique', 'Licence', 'Eni', 'Laboratory Technician', 'Oil & Gas', 2600, 'Gabes', 4, 'Yes'),
  ('09727717', 'Fethi Kbaili', 2020, 'Gestion', 'Licence', 'Freelance', 'Consultant', 'Consulting', 2000, 'Sousse', 1, 'Yes'),
  ('09727718', 'Ghazi Bouazizi', 2018, 'Electrique', 'Licence', 'Tunisie Telecom', 'Network Engineer', 'Telecom', 2500, 'Tunis', 3, 'Yes'),
  ('09727719', 'Hayet Ben Ammar', 2019, 'Informatique', 'Licence', 'Instadeep', 'Data Analyst', 'AI & Data', 3200, 'Tunis', 2, 'Yes'),
  ('09727722', 'Rami Kouki', 2021, 'Electrique', 'Licence', 'Unemployed', 'Seeking Employment', 'Unemployed', 0, 'Tozeur', 12, 'No'),
  ('09727733', 'Ines Maatouk', 2021, 'Gestion', 'Licence', 'BIAT', 'Risk Analyst', 'Banking', 2300, 'Tunis', 5, 'Yes'),
  ('09727736', 'Lotfi Ghanmi', 2021, 'Gestion', 'Licence', 'Ooredoo', 'Project Manager', 'Telecom', 3000, 'Tunis', 4, 'Yes'),
  ('09727739', 'Oussama Khmiri', 2021, 'Gestion', 'Licence', 'Amazon', 'Operations Analyst', 'E-commerce', 3500, 'Dubai', 7, 'Yes');

-- ============================================================
-- 4. CHARTS (9 charts, 8 different types)
-- ============================================================
INSERT INTO charts (title, chart_type, dataset_id, config, created_by) VALUES
  ('Moyenne GPA par departement', 'bar', (SELECT id FROM datasets WHERE table_name='data_students'), '{"xField":"department","yField":"gpa","aggregation":"avg","colorPalette":"default"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Distribution des notes', 'pie', (SELECT id FROM datasets WHERE table_name='data_grades'), '{"labelField":"subject","valueField":"grade","aggregation":"avg","colorPalette":"warm"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Evolution des inscriptions', 'line', (SELECT id FROM datasets WHERE table_name='data_students'), '{"xField":"enrollment_year","yField":"cin","aggregation":"count","colorPalette":"cool"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Taux de reussite par cours', 'bar', (SELECT id FROM datasets WHERE table_name='data_courses_results'), '{"xField":"course_name","yField":"pass_rate","aggregation":"none","colorPalette":"default"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Etudiants actifs vs inactifs', 'doughnut', (SELECT id FROM datasets WHERE table_name='data_students'), '{"labelField":"is_active","valueField":"cin","aggregation":"count"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Salaires par secteur', 'horizontalBar', (SELECT id FROM datasets WHERE table_name='data_alumni_employment'), '{"xField":"sector","yField":"monthly_salary","aggregation":"avg","colorPalette":"warm"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Nombre d etudiants par annee', 'bar', (SELECT id FROM datasets WHERE table_name='data_students'), '{"xField":"enrollment_year","yField":"cin","aggregation":"count","colorPalette":"pastel"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Notes moyennes par semestre', 'line', (SELECT id FROM datasets WHERE table_name='data_grades'), '{"xField":"semester","yField":"grade","aggregation":"avg","colorPalette":"cool"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Repartition par departement', 'polarArea', (SELECT id FROM datasets WHERE table_name='data_students'), '{"labelField":"department","valueField":"cin","aggregation":"count"}', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. DASHBOARDS (3 dashboards with chart layouts)
-- ============================================================
INSERT INTO dashboards (title, description, layout, created_by, is_public) VALUES
  ('Tableau de bord academique', 'Vue d ensemble des performances academiques des etudiants',
  '[{"i":"chart-1","x":0,"y":0,"w":6,"h":4},{"i":"chart-2","x":6,"y":0,"w":6,"h":4},{"i":"chart-3","x":0,"y":4,"w":12,"h":4}]',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), true),
  ('Tableau de bord emploi', 'Suivi de l insertion professionnelle des diplomes',
  '[{"i":"chart-6","x":0,"y":0,"w":6,"h":4},{"i":"chart-5","x":6,"y":0,"w":6,"h":4}]',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), true),
  ('Tableau de bord interne', 'Analyses internes - non publie',
  '[{"i":"chart-4","x":0,"y":0,"w":12,"h":4},{"i":"chart-7","x":0,"y":4,"w":6,"h":4},{"i":"chart-8","x":6,"y":4,"w":6,"h":4}]',
  (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), false)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. FOREIGN KEY LINKS (2 links)
-- ============================================================
INSERT INTO foreign_keys (source_table, source_column, target_table, target_column, created_by) VALUES
  ('data_grades', 'student_cin', 'data_students', 'cin', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('data_students', 'cin', 'clients', 'cin', (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT (source_table, source_column, target_table, target_column) DO NOTHING;

-- ============================================================
-- 7. SAVED QUERIES (5 queries)
-- ============================================================
INSERT INTO saved_queries (title, sql, description, is_public, created_by) VALUES
  ('Top 10 etudiants par GPA', 'SELECT cin, full_name, department, gpa FROM data_students WHERE gpa IS NOT NULL ORDER BY gpa DESC LIMIT 10', 'Les 10 meilleurs etudiants par moyenne GPA', true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Notes moyennes par matiere', 'SELECT subject, AVG(grade) as avg_grade, MIN(grade) as min_grade, MAX(grade) as max_grade, COUNT(*) as count FROM data_grades GROUP BY subject ORDER BY avg_grade DESC', 'Statistiques de notes par matiere', true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Etudiants sans notes', 'SELECT s.cin, s.full_name, s.department FROM data_students s LEFT JOIN data_grades g ON s.cin = g.student_cin WHERE g.student_cin IS NULL', 'Etudiants sans enregistrement de notes', false, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Taux de reussite par departement', 'SELECT d.name as department, COUNT(s.cin) as students, AVG(s.gpa) as avg_gpa FROM data_departments d LEFT JOIN data_students s ON d.name = s.department GROUP BY d.name ORDER BY avg_gpa DESC', 'Performance moyenne par departement', true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Emploi des diplomes par secteur', 'SELECT sector, COUNT(*) as count, AVG(monthly_salary) as avg_salary FROM data_alumni_employment WHERE current_employer != ''Unemployed'' GROUP BY sector ORDER BY count DESC', 'Repartition sectorielle et salaires moyens des diplomes', true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- 8. SURVEYS (3 surveys with schema)
-- ============================================================
INSERT INTO surveys (user_id, title, description, goal, schema) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Satisfaction des etudiants', 'Enquete de satisfaction annuelle des etudiants', 'Mesurer le niveau de satisfaction global et par service',
  '{"fields":[{"id":"f1","type":"rating","label":"Qualite des cours","required":true},{"id":"f2","type":"rating","label":"Qualite des infrastructures","required":true},{"id":"f3","type":"textarea","label":"Commentaires et suggestions","required":false},{"id":"f4","type":"select","label":"Departement","required":true,"options":["Informatique","Electrique","Gestion"]},{"id":"f5","type":"text","label":"Nom (optionnel)","required":false}]}'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Enquete alumni', 'Suivi de l insertion professionnelle', 'Evaluer l employabilite des diplomes',
  '{"fields":[{"id":"f1","type":"select","label":"Annee d obtention du diplome","required":true,"options":["2018","2019","2020","2021","2022","2023"]},{"id":"f2","type":"text","label":"Emploi actuel","required":true},{"id":"f3","type":"number","label":"Salaire mensuel (TND)","required":false},{"id":"f4","type":"select","label":"Satisfaction","required":true,"options":["Tres satisfait","Satisfait","Neutre","Insatisfait","Tres insatisfait"]},{"id":"f5","type":"textarea","label":"Commentaires","required":false}]}'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Evaluation des enseignants', 'Evaluation de la qualite pedagogique', 'Ameliorer la qualite de l enseignement',
  '{"fields":[{"id":"f1","type":"text","label":"Nom de l enseignant","required":true},{"id":"f2","type":"rating","label":"Qualite de l enseignement","required":true},{"id":"f3","type":"rating","label":"Disponibilite","required":true},{"id":"f4","type":"rating","label":"Clarte des explications","required":true},{"id":"f5","type":"textarea","label":"Points d amelioration","required":false}]}')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. REPORTS (3 reports)
-- ============================================================
INSERT INTO reports (title, content, report_type, client_id, dataset_id, is_public, created_by) VALUES
  ('Rapport de performance - Ahmed Ben Ali', '## Rapport de Performance\n\n**Etudiant:** Ahmed Ben Ali\n**CIN:** 09727760\n**Departement:** Informatique\n\n### Resume\nAhmed presente des performances au-dessus de la moyenne dans la plupart des matieres. Particulierement doue en Programmation C (16.00) et Algorithmique (15.50).\n\n### Points forts\n- Programmation C: 16.00\n- Algorithmique: 15.50\n- Bases de donnees: 14.00\n\n### Points a ameliorer\n- Reseaux: 13.50\n\n### Recommandations\nEncourager la specialisation en developpement logiciel.', 'performance', (SELECT id FROM clients WHERE cin='09727760'), (SELECT id FROM datasets WHERE table_name='data_grades'), true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Rapport global du departement Informatique', '## Rapport Departemental\n\n**Departement:** Informatique\n**Annee:** 2024-2025\n\n### Statistiques\n- Nombre d etudiants: 180\n- Moyenne GPA: 14.2\n- Taux de reussite: 78%\n\n### Observations\nLe departement Informatique montre une tendance positive avec une augmentation de 5% du taux de reussite par rapport a l annee precedente.\n\n### Matieres critiques\n- Intelligence artificielle: taux de reussite 73.3% (a surveiller)\n- Systemes d exploitation: taux de reussite 72.2% (a surveiller)', 'department', NULL, (SELECT id FROM datasets WHERE table_name='data_students'), true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn')),
  ('Rapport d insertion professionnelle', '## Rapport d Insertion Professionnelle\n\n**Periode:** 2018-2023\n\n### Taux d emploi\n- 6 mois apres diplome: 75%\n- 12 mois apres diplome: 91%\n\n### Salaire moyen par secteur\n- IT: 2800 TND\n- Banque: 2250 TND\n- Energie: 2450 TND\n- Telecom: 2500 TND\n\n### Recommandations\nRenforcer les partenariats avec les entreprises du secteur IT et telecom pour ameliorer les opportunites de stage.', 'employment', NULL, (SELECT id FROM datasets WHERE table_name='data_alumni_employment'), true, (SELECT id FROM users WHERE email='admin@iset-tozeur.tn'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. NOTIFICATIONS (10 notifications, 4 types)
-- ============================================================
INSERT INTO notifications (user_id, type, title, message, is_read) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info', 'Bienvenue sur ISET Observatory', 'Votre plateforme d analyse de donnees est prete. Explorez les tableaux de bord et les outils IA.', false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'success', 'Donnees importees', 'Le fichier students.csv a ete importe avec succes (50 lignes).', true),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'warning', 'Migration requise', 'Une nouvelle mise a jour est disponible. Contactez l administrateur systeme.', false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info', 'Nouveau rapport genere', 'Un rapport de performance a ete genere pour l etudiant Ahmed Ben Ali.', false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'success', 'Dashboard publie', 'Le tableau de bord "Tableau de bord academique" est maintenant public.', true),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'info', 'Nouveau tableau de bord', 'Un nouveau tableau de bord a ete cree par l administrateur.', false),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'success', 'Requete enregistree', 'Votre requete "Top 10 etudiants par GPA" a ete sauvegardee.', true),
  ((SELECT id FROM users WHERE email='viewer@iset-tozeur.tn'), 'info', 'Donnees disponibles', 'De nouvelles donnees sont disponibles pour analyse.', false),
  ((SELECT id FROM users WHERE email='viewer@iset-tozeur.tn'), 'warning', 'Session expiree', 'Votre session va expirer dans 10 minutes.', false),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'info', 'AI disponible', 'L assistant IA est maintenant disponible pour vos analyses.', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 11. AI QUERIES AUDIT (7 entries)
-- ============================================================
INSERT INTO ai_queries (user_id, question, created_at) VALUES
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Quelle est la moyenne GPA par departement?', NOW() - INTERVAL '5 days'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Combien d etudiants sont inscrits en 2023?', NOW() - INTERVAL '4 days'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Quels sont les cours avec le plus faible taux de reussite?', NOW() - INTERVAL '3 days'),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'Montre moi la distribution des salaires des diplomes', NOW() - INTERVAL '2 days'),
  ((SELECT id FROM users WHERE email='analyst@iset-tozeur.tn'), 'Quels etudiants n ont pas de notes?', NOW() - INTERVAL '1 day'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Compare les performances entre les departements', NOW() - INTERVAL '12 hours'),
  ((SELECT id FROM users WHERE email='admin@iset-tozeur.tn'), 'Genere un rapport sur l insertion professionnelle', NOW())
ON CONFLICT DO NOTHING;

COMMIT;
