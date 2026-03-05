import pool from './database';

const migrations = [
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
    await pool.query(m.sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [m.name]);
    console.log(`✅ Migration applied: ${m.name}`);
  }
}
