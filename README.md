<div align="center">

# 🔭 ISET Observatory

**Adaptive Digital Observatory — Data Management & AI Analytics Platform**

*Built for ISET Tozeur to centralise, analyse, and visualise academic and professional-integration data.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://www.postgresql.org)
[![Deployed on Railway](https://img.shields.io/badge/Backend-Railway-7b2cf7.svg)](https://railway.app)
[![Deployed on Vercel](https://img.shields.io/badge/Frontend-Vercel-000000.svg)](https://vercel.com)

[Live Demo](https://iset-observatory.vercel.app) · [Deployment Guide](docs/DEPLOYMENT.md) · [Roadmap](docs/ROADMAP.md)

---

</div>

## ✨ Overview

ISET Observatory is a **schema-agnostic data engine** — administrators import any CSV or Excel file, map columns to SQL types interactively, and the system auto-creates a live PostgreSQL table. No migrations written by hand.

From there, users can query data using **natural language** (powered by Groq AI), build **interactive charts**, compose **live dashboards**, export **PDF reports**, and design **surveys** — all within a single platform.

---

## 🗂️ Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Branch Strategy](#-branch-strategy)
- [License](#-license)

---

## 🚀 Features

### 📥 Data Import Engine
- Upload **CSV, XLS, XLSX** files of any schema
- Interactive column-type mapping (text, integer, decimal, date, boolean)
- Bulk insert into auto-created PostgreSQL tables
- Live row-count tracking and status indicators

### 🗄️ Database Explorer
- Browse all imported datasets as live SQL tables
- Inline **row editing, insertion, and deletion**
- Column **rename** and **type conversion**
- Paginated, searchable table viewer

### 🤖 AI Analysis (Groq-powered)
- Ask questions in **plain English** → get SQL + structured results
- AI-generated **insights** summarised from query data
- Inline **chart builder** from result tables (Bar, Line, Pie, Doughnut, Horizontal Bar)
- Save AI-generated charts directly to the Charts collection

### 📊 Chart Builder
- 7 chart types: **Bar, Horizontal Bar, Line, Pie, Doughnut, Radar, Polar Area**
- Column-mapped or AI-SQL-backed data sources
- Reusable chart library shared across dashboards

### 🖥️ Dashboard Canvas
- Drag-and-drop chart layout builder
- Export dashboards as **multi-page A4 PDF reports** with cover page, chart titles, and page numbers

### 📋 Survey Generator
- AI-assisted survey design from a topic description
- Schema-driven question builder (multiple choice, text, scale)
- Shareable survey links

### 👥 User & Role Management
- Full **RBAC** (Role-Based Access Control) with granular per-resource permissions
- Built-in roles: `super_admin`, `admin`, `analyst`, `viewer`
- Custom role creation with permission picker
- Self-deletion prevention; super admin is permanently protected

### 🔐 Authentication
- JWT-based auth with configurable expiry
- Secure password hashing (bcryptjs)
- Protected routes on both frontend and backend

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4 |
| **UI System** | Custom aerogel design system (CSS variables) |
| **Charts** | Chart.js 4, react-chartjs-2 |
| **PDF Export** | jsPDF |
| **Backend** | Node.js 20, Express, TypeScript |
| **Database** | PostgreSQL 15 |
| **DB Driver** | Raw SQL with `pg` (node-postgres) |
| **Authentication** | JSON Web Tokens (jsonwebtoken + bcryptjs) |
| **AI** | Groq SDK — `qwen/qwen3-32b` model |
| **File Parsing** | csv-parse, ExcelJS |
| **Containerisation** | Docker, Docker Compose v2 |
| **CI/CD** | GitHub → Railway (backend) + Vercel (frontend) |

---

## 📁 Project Structure

```
iset-observatory/
├── backend/                   # Express + TypeScript API
│   ├── src/
│   │   ├── config/            # DB pool, migrations, app config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth guard, error handler, file upload
│   │   ├── routes/            # Express routers
│   │   └── services/          # AI query engine, file parsing, table builder
│   ├── Dockerfile             # Multi-stage production image
│   └── package.json
├── frontend/                  # React 19 + Vite SPA
│   ├── src/
│   │   ├── components/        # Layout, sidebar, auth guards
│   │   ├── contexts/          # AuthContext (JWT state)
│   │   ├── lib/               # Axios client, TypeScript types
│   │   └── pages/             # All page components
│   ├── vercel.json            # SPA rewrite rule
│   └── package.json
├── db/
│   └── init/                  # Docker Compose DB initialisation scripts
├── docs/
│   ├── DEPLOYMENT.md          # Full deployment guide (Railway, Vercel, Docker)
│   ├── PROJECT_DESCRIPTION.md # Feature specifications
│   └── ROADMAP.md             # Development roadmap
├── docker-compose.yml         # Local development stack (3 services)
├── railway.toml               # Railway deployment configuration
├── .env.example               # Backend environment template
├── LICENSE                    # MIT License
└── README.md
```

---

## 🏁 Getting Started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose v2
- [Node.js 20+](https://nodejs.org) *(for local dev without Docker)*
- A [Groq API key](https://console.groq.com) *(free tier available)*

### Option A — Docker Compose (recommended)

```bash
# 1. Clone the repo
git clone https://github.com/General-Sandwalker/iset-observatory.git
cd iset-observatory

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum set GROQ_API_KEY and a strong JWT_SECRET

# 3. Build and run
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |
| PostgreSQL | localhost:5432 |

Log in with the credentials you set as `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` in `.env`.

---

### Option B — Local dev (without Docker)

**Backend:**
```bash
cd backend
npm install
cp ../.env.example .env   # fill in DATABASE_HOST, DATABASE_USER, etc.
npm run dev               # hot-reload on port 5000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env      # set VITE_API_URL=http://localhost:5000/api
npm run dev               # Vite dev server on port 5173
```

> You will need a running PostgreSQL 15 instance matching the credentials in `.env`.

---

## 🔧 Environment Variables

### Backend (`.env`)

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Full PostgreSQL URL (Railway / PaaS) | When hosted |
| `DATABASE_HOST` | DB hostname | Docker / local |
| `DATABASE_PORT` | DB port | Docker / local |
| `DATABASE_USER` | DB user | Docker / local |
| `DATABASE_PASSWORD` | DB password | Docker / local |
| `DATABASE_NAME` | DB name | Docker / local |
| `JWT_SECRET` | Long random string for signing tokens | ✅ |
| `GROQ_API_KEY` | Groq API key from console.groq.com | ✅ |
| `GROQ_MODEL` | Groq model ID | Default: `qwen/qwen3-32b` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma-separated | ✅ |
| `SUPER_ADMIN_EMAIL` | Bootstrapped admin email | ✅ |
| `SUPER_ADMIN_PASSWORD` | Bootstrapped admin password | ✅ |
| `PORT` | Server port | Default: `5000` |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Full URL of the backend API (e.g. `https://your-api.up.railway.app/api`) |

See `.env.example` and `frontend/.env.example` for full templates.

---

## 🚢 Deployment

See the **[Deployment Guide](docs/DEPLOYMENT.md)** for complete step-by-step instructions covering:

- **Railway** — Docker-based backend + managed PostgreSQL
- **Vercel** — Vite SPA frontend
- **Docker Compose** — fully self-hosted on any server

**Quick reference:**

| Target | Platform | Config file |
|---|---|---|
| Backend | [Railway](https://railway.app) | `railway.toml` |
| Frontend | [Vercel](https://vercel.com) | `frontend/vercel.json` |
| Self-hosted | Docker Compose | `docker-compose.yml` |

---

## 🌿 Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | **Production** — auto-deploys to Railway + Vercel on push |
| `dev` | **Development** — integrate features here before releasing |

```bash
# Start a feature
git checkout dev
git checkout -b feature/my-feature

# ... commit your work ...

git push origin feature/my-feature
# Open a Pull Request → dev
# When stable, PR dev → main to trigger a production deploy
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ for **ISET Tozeur**

</div>
