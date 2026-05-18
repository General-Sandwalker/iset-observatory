import bcrypt from 'bcryptjs';
import pool from './database';

const migrations = [
  {
    name: '001_base_schema',
    sql: `
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
          id            SERIAL PRIMARY KEY,
          email         VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name     VARCHAR(255) NOT NULL,
          role          VARCHAR(50)  NOT NULL DEFAULT 'viewer',
          is_active     BOOLEAN      NOT NULL DEFAULT true,
          created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '002_rbac_schema',
    sql: `
      -- ─── Roles Table ──────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS roles (
          id          SERIAL PRIMARY KEY,
          name        VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          is_system   BOOLEAN NOT NULL DEFAULT false,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- ─── Permissions Table ────────────────────────────────────
      CREATE TABLE IF NOT EXISTS permissions (
          id          SERIAL PRIMARY KEY,
          name        VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          category    VARCHAR(50) NOT NULL DEFAULT 'general'
      );

      -- ─── Role ↔ Permission junction ──────────────────────────
      CREATE TABLE IF NOT EXISTS role_permissions (
          role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
          PRIMARY KEY (role_id, permission_id)
      );

      -- ─── User ↔ Role junction (replace text 'role' column) ───
      CREATE TABLE IF NOT EXISTS user_roles (
          user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          role_id  INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
          PRIMARY KEY (user_id, role_id)
      );

      -- ─── Seed default permissions ────────────────────────────
      INSERT INTO permissions (name, description, category) VALUES
        ('users.view',       'View user list',                 'users'),
        ('users.create',     'Create new users',               'users'),
        ('users.edit',       'Edit existing users',            'users'),
        ('users.delete',     'Delete users',                   'users'),
        ('roles.view',       'View roles',                     'roles'),
        ('roles.create',     'Create roles',                   'roles'),
        ('roles.edit',       'Edit roles',                     'roles'),
        ('roles.delete',     'Delete roles',                   'roles'),
        ('data.import',      'Import data files',              'data'),
        ('data.view',        'View dynamic tables',            'data'),
        ('data.delete',      'Delete dynamic tables',          'data'),
        ('analytics.view',   'View analytics & dashboards',    'analytics'),
        ('analytics.create', 'Create charts & dashboards',     'analytics'),
        ('ai.query',         'Use AI natural language queries', 'ai'),
        ('surveys.view',     'View surveys',                   'surveys'),
        ('surveys.create',   'Create surveys',                 'surveys'),
        ('surveys.manage',   'Manage survey responses',        'surveys')
      ON CONFLICT (name) DO NOTHING;

      -- ─── Seed default roles ──────────────────────────────────
      INSERT INTO roles (name, description, is_system) VALUES
        ('super_admin', 'Full system access',                       true),
        ('admin',       'Administrative access without system ops', true),
        ('analyst',     'Can view data and use analytics',          true),
        ('viewer',      'Read-only access',                         true)
      ON CONFLICT (name) DO NOTHING;

      -- ─── Grant all permissions to super_admin ────────────────
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'super_admin'
      ON CONFLICT DO NOTHING;

      -- ─── Grant admin permissions ─────────────────────────────
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'admin'
        AND p.name NOT IN ('roles.delete')
      ON CONFLICT DO NOTHING;

      -- ─── Grant analyst permissions ───────────────────────────
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'analyst'
        AND p.name IN ('data.view', 'analytics.view', 'analytics.create', 'ai.query', 'surveys.view')
      ON CONFLICT DO NOTHING;

      -- ─── Grant viewer permissions ────────────────────────────
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'viewer'
        AND p.name IN ('data.view', 'analytics.view', 'surveys.view')
      ON CONFLICT DO NOTHING;

      -- ─── Link existing super_admin user to super_admin role ──
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id
      FROM users u, roles r
      WHERE u.role = 'super_admin' AND r.name = 'super_admin'
      ON CONFLICT DO NOTHING;
    `,
  },
  {
    name: '003_datasets_schema',
    sql: `
      -- ─── Datasets / uploaded-file registry ───────────────────
      CREATE TABLE IF NOT EXISTS datasets (
          id              SERIAL PRIMARY KEY,
          name            VARCHAR(255) NOT NULL,
          file_name       VARCHAR(255) NOT NULL,
          table_name      VARCHAR(255) UNIQUE,
          status          VARCHAR(50) NOT NULL DEFAULT 'uploaded',
          row_count       INT DEFAULT 0,
          column_mapping  JSONB,
          uploaded_by     INT REFERENCES users(id),
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- ─── Index for quick lookups ─────────────────────────────
      CREATE INDEX IF NOT EXISTS idx_datasets_status ON datasets(status);
      CREATE INDEX IF NOT EXISTS idx_datasets_uploaded_by ON datasets(uploaded_by);
    `,
  },
  {
    name: '004_charts_dashboards',
    sql: `
      -- ─── Saved Charts ────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS charts (
          id              SERIAL PRIMARY KEY,
          title           VARCHAR(255) NOT NULL,
          chart_type      VARCHAR(50)  NOT NULL,
          dataset_id      INT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
          config          JSONB NOT NULL DEFAULT '{}',
          created_by      INT REFERENCES users(id),
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- ─── Dashboards ──────────────────────────────────────────
      CREATE TABLE IF NOT EXISTS dashboards (
          id              SERIAL PRIMARY KEY,
          title           VARCHAR(255) NOT NULL,
          description     TEXT,
          layout          JSONB NOT NULL DEFAULT '[]',
          created_by      INT REFERENCES users(id),
          created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '005_user_preferences',
    sql: `
      ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}';
    `,
  },
  {
    name: '006_surveys',
    sql: `
      CREATE TABLE IF NOT EXISTS surveys (
          id          SERIAL PRIMARY KEY,
          user_id     INT REFERENCES users(id) ON DELETE SET NULL,
          title       VARCHAR(255) NOT NULL,
          description TEXT,
          goal        TEXT,
          schema      JSONB NOT NULL DEFAULT '{}',
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '007_ai_queries',
    sql: `
      CREATE TABLE IF NOT EXISTS ai_queries (
        id         SERIAL PRIMARY KEY,
        user_id    INT REFERENCES users(id) ON DELETE SET NULL,
        question   TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
  },
  {
    name: '008_charts_nullable_dataset',
    sql: `
      ALTER TABLE charts
      ALTER COLUMN dataset_id DROP NOT NULL;
    `,
  },
  {
    name: '009_foreign_keys',
    sql: `
      CREATE TABLE IF NOT EXISTS foreign_keys (
        id SERIAL PRIMARY KEY,
        source_table VARCHAR(255) NOT NULL,
        source_column VARCHAR(255) NOT NULL,
        target_table VARCHAR(255) NOT NULL,
        target_column VARCHAR(255) NOT NULL,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT fk_unique_link UNIQUE (source_table, source_column, target_table, target_column)
      );
    `,
  },
  {
    name: '010_saved_queries',
    sql: `
      CREATE TABLE IF NOT EXISTS saved_queries (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        sql TEXT NOT NULL,
        description TEXT,
        is_public BOOLEAN DEFAULT false,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `,
  },
  {
    name: '011_notifications',
    sql: `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(20) DEFAULT 'info',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
  `,
  },
  {
    name: '012_clients_schema',
    sql: `
    CREATE TABLE IF NOT EXISTS clients (
      id SERIAL PRIMARY KEY,
      cin VARCHAR(50) UNIQUE NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      client_type VARCHAR(50) NOT NULL DEFAULT 'student',
      is_active BOOLEAN NOT NULL DEFAULT true,
      password_hash VARCHAR(255) NOT NULL,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(client_type);
    CREATE INDEX IF NOT EXISTS idx_clients_cin ON clients(cin);

    INSERT INTO roles (name, description, is_system) VALUES
      ('student', 'Student - can view published dashboards, take surveys, and generate performance reports', true),
      ('alumni', 'Alumni - can view published dashboards and generate performance reports', true),
      ('teacher', 'Teacher - can manage data, view analytics, and manage surveys', true)
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO permissions (name, description, category) VALUES
      ('clients.view', 'View client accounts', 'users'),
      ('clients.create', 'Create client accounts', 'users'),
      ('clients.edit', 'Edit client accounts', 'users'),
      ('clients.delete', 'Delete client accounts', 'users'),
      ('clients.import', 'Bulk import clients from CSV', 'users'),
      ('reports.generate', 'Generate AI performance reports', 'analytics'),
      ('reports.view', 'View published reports', 'analytics'),
      ('dashboards.publish', 'Publish dashboards for public viewing', 'analytics')
    ON CONFLICT (name) DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'super_admin' AND p.name IN ('clients.view','clients.create','clients.edit','clients.delete','clients.import','reports.generate','reports.view','dashboards.publish')
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'admin' AND p.name IN ('clients.view','clients.create','clients.edit','clients.delete','clients.import','reports.generate','reports.view','dashboards.publish')
    ON CONFLICT DO NOTHING;

    INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
      WHERE r.name = 'teacher' AND p.name IN ('data.view','data.import','analytics.view','analytics.create','ai.query','surveys.view','surveys.create','surveys.manage','clients.view','clients.create','reports.generate','reports.view')
    ON CONFLICT DO NOTHING;

    ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(50) DEFAULT 'staff';
  `,
  },
  {
    name: '013_published_dashboards_reports',
    sql: `
    ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      report_type VARCHAR(50) NOT NULL DEFAULT 'performance',
      client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
      dataset_id INTEGER REFERENCES datasets(id) ON DELETE SET NULL,
      is_public BOOLEAN NOT NULL DEFAULT false,
      created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id);
CREATE INDEX IF NOT EXISTS idx_reports_public ON reports(is_public);
`, },
{ name: '014_survey_publishing', sql: `
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'draft';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS client_types JSONB DEFAULT '[]';
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS responses_count INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS survey_responses (
  id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  respondent_type VARCHAR(20),
  answers JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_client ON survey_responses(client_id);
`, },
];

export async function runMigrations(): Promise<void> {
  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name       VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  for (const m of migrations) {
    const existing = await pool.query('SELECT 1 FROM _migrations WHERE name = $1', [m.name]);
    if (existing.rows.length > 0) continue;

    console.log(`⏳ Running migration: ${m.name}`);
    try {
      await pool.query(m.sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [m.name]);
      console.log(`✅ Migration applied: ${m.name}`);
    } catch (err) {
      console.error(`❌ Migration failed: ${m.name}`, err);
      // Continue to next migration — do not abort entire startup
    }
  }

  // Seed super admin from env vars if no super_admin exists
  try {
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@iset-tozeur.tn';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123!';
    const existing = await pool.query(`SELECT 1 FROM users WHERE role = 'super_admin'`);
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        `INSERT INTO users (email, password_hash, full_name, role)
         VALUES ($1, $2, 'Super Administrator', 'super_admin')
         ON CONFLICT (email) DO NOTHING`,
        [adminEmail, hash]
      );
      console.log(`✅ Super admin seeded: ${adminEmail}`);
    }
    // Ensure super_admin user is linked to super_admin role in user_roles
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id)
      SELECT u.id, r.id FROM users u, roles r
      WHERE u.role = 'super_admin' AND r.name = 'super_admin'
      ON CONFLICT DO NOTHING
    `);
  } catch (err) {
    console.error('❌ Super admin seed failed:', err);
  }
}
