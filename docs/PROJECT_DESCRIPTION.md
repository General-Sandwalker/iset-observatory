# ISET Tozeur: Adaptive Digital Observatory & Data Engine

## 1. Project Vision
The **Adaptive Digital Observatory** is a next-generation data management platform built for ISET Tozeur. Its primary purpose is to centralize, analyze, and visualize academic performance and professional integration data (Alumni tracking). 

Unlike traditional software with fixed data fields, this platform is a **"Data Engine"**—it allows administrators to create their own database structures on the fly by importing Excel/CSV files and mapping them to dynamic tables.

## 2. Core Functional Modules

### A. Adaptive Data Ingestion (The Importer)
- **Schema-Agnostic**: Accepts any CSV or Excel file regardless of column names.
- **Visual Mapping**: A UI tool where users match file headers to SQL data types (String, Number, Date, etc.).
- **Dynamic Schema Generation**: Automatically executes `CREATE TABLE` commands in PostgreSQL based on user input.

### B. AI-Assisted Analysis Layer
- **Natural Language to SQL**: Users can ask plain-English questions (e.g., "What percentage of IT graduates found a job within 6 months?") and the AI generates the secure SQL query.
- **Automated Insights**: AI scans datasets to highlight trends, such as declining success rates in specific departments.

### C. Visual Data Showcase (Dashboard Editor)
- **Widget-Based Workspace**: A drag-and-drop editor to create charts (Bar, Pie, Line, Radar) using **Chart.js**.
- **Reporting & Export**: One-click generation of official PDF reports and raw Excel exports.

### D. Identity & Security (RBAC)
- **Strict Access**: No public registration.
- **Seeded Super Admin**: Initialized via Docker environment variables.
- **Granular Permissions**: Fine-grained control over who can import data, create surveys, or view analytics.

## 3. Technical Specifications
- **Frontend**: React.js (Vite) + Tailwind CSS + Lucide Icons.
- **Backend**: Node.js (Express) with TypeScript.
- **Database**: PostgreSQL 15+.
- **Deployment**: Docker & Docker Compose (Multi-container setup).
- **AI Integration**: Google Gemini API or OpenAI API.