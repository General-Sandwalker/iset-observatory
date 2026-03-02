#!/bin/bash
set -e

# ============================================================
# ISET Observatory — Database Initialization
# Runs automatically on first container start via
# docker-entrypoint-initdb.d
# ============================================================

ADMIN_EMAIL="${SUPER_ADMIN_EMAIL:-admin@iset-tozeur.tn}"
ADMIN_PASSWORD="${SUPER_ADMIN_PASSWORD:-Admin@123!}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL

    -- Enable pgcrypto for password hashing
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    -- ─── Users Table ────────────────────────────────────────
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

    -- ─── Seed Super Admin ───────────────────────────────────
    INSERT INTO users (email, password_hash, full_name, role)
    SELECT
        '${ADMIN_EMAIL}',
        crypt('${ADMIN_PASSWORD}', gen_salt('bf', 10)),
        'Super Administrator',
        'super_admin'
    WHERE NOT EXISTS (
        SELECT 1 FROM users WHERE role = 'super_admin'
    );

EOSQL

echo "✅ Database initialized & Super Admin seeded."
