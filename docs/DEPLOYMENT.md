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

### 1.1 Create a New Project

1. Go to [railway.app](https://railway.app) and click **New Project**.
2. Select **Deploy from GitHub Repo** and choose this repository.
3. Railway will detect `railway.toml` and use `backend/Dockerfile` automatically.

### 1.2 Add a PostgreSQL Database

1. Inside your Railway project, click **+ New Service → Database → PostgreSQL**.
2. Railway will provision a PostgreSQL instance and expose a `DATABASE_URL` variable automatically.
3. In your **backend service** settings, make sure the `DATABASE_URL` variable is linked or manually copy it from the database service.

### 1.3 Set Environment Variables

In the backend service's **Variables** tab, add the following:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | A long random string (e.g. `openssl rand -hex 64`) |
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (update after Vercel deploy) |
| `SUPER_ADMIN_EMAIL` | Email for the first admin account |
| `SUPER_ADMIN_PASSWORD` | Password for the first admin account |
| `DATABASE_URL` | Auto-provided by Railway PostgreSQL plugin |

> **Note:** `DATABASE_URL` is usually injected automatically when you link the PostgreSQL service. If not, copy it manually from the PostgreSQL service's **Connect** tab.

### 1.4 Verify the Deploy

- Railway will build the Docker image and start the server.
- Check the **Logs** tab — you should see `Server running on port ...` and migration messages.
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
DB_HOST=postgres
DB_PORT=5432
DB_NAME=observatory
DB_USER=observatory_user
DB_PASSWORD=your_password

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
