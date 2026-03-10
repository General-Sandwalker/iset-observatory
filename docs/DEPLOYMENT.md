# Deployment Guide — Railway + Vercel

This guide covers deploying the **ISET Observatory** platform with:
- **Backend** → [Railway](https://railway.app) (Docker-based Node.js + PostgreSQL)
- **Frontend** → [Vercel](https://vercel.com) (Vite SPA)

---

## Prerequisites

- GitHub account with the repository pushed
- Railway account (free tier is sufficient to start)
- Vercel account

---

## 1. Deploy the Backend on Railway

> **Important:** The PostgreSQL database service must be created **before** the backend service deploys. The server will crash on startup if `DATABASE_URL` is not set, because it runs migrations immediately.

### 1.1 Create the PostgreSQL Service First

1. Go to [railway.app](https://railway.app) and click **New Project**.
2. Click **+ New Service → Database → PostgreSQL**.
3. Wait for it to finish provisioning (a few seconds).

### 1.2 Add the Backend Service

1. In the same project, click **+ New Service → GitHub Repo** and choose this repository.
2. Railway will detect `railway.toml` and use `backend/Dockerfile` automatically.

### 1.3 Link the Database Connection String

The server accepts any of these variable names (checked in order):
`DATABASE_URL`, `DATABASE_PRIVATE_URL`, `POSTGRES_URL`, `POSTGRES_PRIVATE_URL`

1. Go to the **backend service → Variables tab**.
2. Click **+ Add Variable Reference**.
3. Select the PostgreSQL service.
4. Choose **`DATABASE_PRIVATE_URL`** — this uses the internal Railway network (faster, no egress cost).

> **Do not** set `DATABASE_HOST` to the connection string. Only set the single URL variable above. The individual `DATABASE_HOST / PORT / USER / PASSWORD / NAME` vars are for local Docker only and are ignored when a URL variable is present.

### 1.4 Set the Remaining Environment Variables

In the backend service's **Variables** tab, add the following manually:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 64`) |
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `SUPER_ADMIN_EMAIL` | Email for the first admin account |
| `SUPER_ADMIN_PASSWORD` | Password for the first admin account |

### 1.5 Verify the Deploy

- Railway will build the Docker image, run migrations, and start the server.
- The first deploy runs all 8+ migrations — this can take up to a minute. The healthcheck timeout is set to 120 seconds to accommodate this.
- Check the **Logs** tab — you should see `Connected to PostgreSQL`, migration messages, and `Server running on port ...`.
- The health endpoint should return 200: `https://<your-backend>.up.railway.app/api/health`

---

## 2. Deploy the Frontend on Vercel

### 2.1 Create a New Project

1. Go to [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import the same GitHub repository.
3. Set the **Root Directory** to `frontend`.
4. Vercel will auto-detect Vite. Leave the build settings as-is.

### 2.2 Set Environment Variables

In the Vercel project's **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-backend>.up.railway.app/api` |

Replace `<your-backend>` with the actual Railway domain from Step 1.

### 2.3 Deploy

Click **Deploy**. Vercel will build the Vite app and serve it via CDN.

`vercel.json` is already configured to rewrite all routes to `index.html` for SPA routing.

---

## 3. Post-Deploy Steps

1. **Update CORS**: Once you have your Vercel URL, go back to Railway and update `CORS_ORIGIN` to `https://your-app.vercel.app`.
2. **Login**: Visit your Vercel URL and log in with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.
3. **Import data**: Go to **Data Import** and upload a CSV or Excel file to get started.

---

## 4. Self-Hosted with Docker Compose

Deploy the entire stack on any Linux server (VPS, on-premise, local network) using Docker Compose — no cloud accounts required.

### 4.1 Prerequisites

- Docker Engine 24+ and Docker Compose v2
- Git
- A server or VPS with ports **5173** and **5000** accessible (or reverse-proxy them via Nginx/Caddy)

### 4.2 Clone and Configure

```bash
git clone https://github.com/General-Sandwalker/iset-observatory.git
cd iset-observatory

cp .env.example .env
```

Open `.env` and set the required values:

```env
# Database — used internally by Docker Compose
DATABASE_HOST=db
DATABASE_PORT=5432
DATABASE_NAME=observatory_db
DATABASE_USER=observatory
DATABASE_PASSWORD=change_me_strong_password

# Security
JWT_SECRET=change_me_to_a_long_random_string

# AI
GROQ_API_KEY=gsk_...your_groq_api_key...

# First admin account (created automatically on first boot)
SUPER_ADMIN_EMAIL=admin@your-domain.com
SUPER_ADMIN_PASSWORD=Admin@SecurePassword1!

# CORS — set to the URL users will access the frontend from
CORS_ORIGIN=http://your-server-ip:5173
```

Generate a strong JWT secret:
```bash
openssl rand -hex 64
```

### 4.3 Build and Start

```bash
docker compose up --build -d
```

This starts three services:
| Service | Container | Port |
|---|---|---|
| PostgreSQL 15 | `db` | 5432 (internal) |
| Backend API | `backend` | 5000 |
| Frontend (Vite preview) | `frontend` | 5173 |

### 4.4 Verify the Deployment

```bash
# Check all containers are running
docker compose ps

# Watch backend logs (migrations + startup)
docker compose logs -f backend

# Health check
curl http://localhost:5000/api/health
```

You should see `{"status":"ok"}` from the health endpoint.

Open **http://localhost:5173** in a browser and log in with your `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`.

### 4.5 Managing the Stack

```bash
# Stop (data is preserved)
docker compose down

# Stop AND wipe all data (PostgreSQL volume deleted)
docker compose down -v

# Restart after a code update
git pull
docker compose up --build -d

# View live logs
docker compose logs -f

# Run a one-off command (e.g. psql)
docker compose exec db psql -U observatory -d observatory_db
```

### 4.6 Production Tips

- **Reverse proxy**: Put Nginx or Caddy in front of ports 5000 and 5173 with TLS certificates (Let's Encrypt).
- **Persistent backups**: The PostgreSQL data lives in the `pg_data` Docker volume. Back it up with `pg_dump`.
- **Firewall**: Only expose the proxy ports externally; keep 5432 private.
- **Updates**: Pull the latest code, rebuild with `docker compose up --build -d`.

---

## 5. Local Development

For a hot-reloading development environment, use Docker Compose the same way — the `frontend` service runs the Vite dev server with HMR and the `backend` service reloads on file changes via `ts-node-dev`.

```bash
cp .env.example .env
# Edit .env with your values
docker compose up --build
```

- Frontend (Vite HMR): http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432 (connect with any DB client)

See `.env.example` and `frontend/.env.example` for all available configuration variables.

---

## 6. Environment Variable Reference

### Backend (`.env`)

```env
NODE_ENV=development
PORT=5000

# Individual vars (Docker / local)
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=observatory
DATABASE_USER=observatory_user
DATABASE_PASSWORD=your_password

# Or single URL (Railway / PaaS)
DATABASE_URL=postgresql://user:password@host:5432/dbname

JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_admin_password
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```
