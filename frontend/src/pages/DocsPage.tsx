import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Brain,
  ChartBar,
  Database,
  FileArrowUp,
  GridFour,
  ShieldCheck,
} from '@phosphor-icons/react';
import PublicNavbar from '../components/layout/PublicNavbar';

const docsSections = [
  {
    icon: FileArrowUp,
    title: 'Getting Started',
    description: 'Install dependencies, configure environment variables, and run the stack in development or Docker mode.',
    action: 'Setup Guide',
  },
  {
    icon: Database,
    title: 'Data Import and Explorer',
    description: 'Upload datasets, map columns, and manage rows, schema, and table operations from the explorer.',
    action: 'Data Guide',
  },
  {
    icon: Brain,
    title: 'AI Analysis',
    description: 'Run natural-language queries, review generated SQL, and turn outputs into saved visual assets.',
    action: 'AI Guide',
  },
  {
    icon: ChartBar,
    title: 'Charts and Dashboards',
    description: 'Build chart configurations and compose dashboard canvases with export-ready reporting.',
    action: 'Visualization Guide',
  },
  {
    icon: GridFour,
    title: 'Survey Generation',
    description: 'Generate structured survey schemas with AI and share survey content externally.',
    action: 'Survey Guide',
  },
  {
    icon: ShieldCheck,
    title: 'Users, Roles, and Security',
    description: 'Manage user accounts, role permissions, and secure operation patterns across your workspace.',
    action: 'Security Guide',
  },
];

export default function DocsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-base-content">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <section className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/75 px-4 py-1.5 text-xs font-semibold tracking-wide">
            Documentation
          </span>
          <h1 className="mt-5 text-4xl sm:text-5xl font-semibold leading-tight">Product Documentation</h1>
          <p className="mt-4 text-base sm:text-lg text-base-content/70 leading-relaxed">
            Learn how to deploy, configure, and use every module in ISET Observatory with a practical,
            workflow-oriented structure.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button onClick={() => navigate('/login')} className="btn btn-primary rounded-xl">
              Open Workspace
              <ArrowRight size={15} />
            </button>
            <button onClick={() => navigate('/features')} className="btn btn-outline rounded-xl">View Features</button>
          </div>
        </section>

        <section className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {docsSections.map(({ icon: Icon, title, description, action }) => (
            <article key={title} className="ag-card p-5 h-full transition hover:-translate-y-0.5 hover:shadow-xl">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon size={22} weight="duotone" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-base-content/70 leading-relaxed">{description}</p>
              <button className="mt-4 btn btn-ghost btn-sm rounded-lg px-2">{action}</button>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-base-300 bg-base-100/80 p-6">
          <h3 className="text-xl font-semibold">Quick Start Commands</h3>
          <div className="mt-4 mockup-code text-sm">
            <pre data-prefix="$"><code>cp .env.example .env</code></pre>
            <pre data-prefix="$"><code>docker compose up --build -d</code></pre>
            <pre data-prefix="$"><code>open http://localhost:5173</code></pre>
          </div>
        </section>
      </main>
    </div>
  );
}
