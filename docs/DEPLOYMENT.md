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

### 1.3 Link DATABASE_URL

The server uses `DATABASE_URL` (a single connection string) — **do not** set `DATABASE_HOST`, `DATABASE_PORT`, etc. manually.

1. Go to the **backend service → Variables tab**.
2. Click **+ Add Variable Reference**.
3. Select the PostgreSQL service and choose `DATABASE_URL`.

Railway will inject the full connection string (e.g. `postgresql://user:pass@postgres.railway.internal:5432/railway`) automatically. The internal hostname `postgres.railway.internal` is only reachable within the Railway project — this is the correct host.

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

## 4. Local Development

Use Docker Compose for local development:

```bash
cp .env.example .env
# Edit .env with your values
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- PostgreSQL: localhost:5432

See `.env.example` and `frontend/.env.example` for all available configuration variables.

---

## 5. Environment Variable Reference

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
