-- ============================================================
-- ISET Observatory — Database Initialization
-- This runs automatically on first container start via
-- docker-entrypoint-initdb.d
-- ============================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            VARCHAR(50)  NOT NULL DEFAULT 'viewer',
    is_active       BOOLEAN      NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Seed Super Admin ───────────────────────────────────────
-- Password is hashed using pgcrypto's bcrypt (bf algorithm).
-- The default password is 'Admin@123!' — override via
-- SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD env vars in
-- docker-compose.yml
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'super_admin') THEN
        INSERT INTO users (email, password_hash, full_name, role)
        VALUES (
            COALESCE(current_setting('app.super_admin_email', true), 'admin@iset-tozeur.tn'),
            crypt(
                COALESCE(current_setting('app.super_admin_password', true), 'Admin@123!'),
                gen_salt('bf', 10)
            ),
            'Super Administrator',
            'super_admin'
        );
        RAISE NOTICE '✅ Super Admin account created.';
    ELSE
        RAISE NOTICE '⚠️  Super Admin already exists — skipping seed.';
    END IF;
END
$$;
