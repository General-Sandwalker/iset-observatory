import { useNavigate } from 'react-router-dom';
import {
  ChartBar,
  CheckCircle,
  Database,
  FileArrowUp,
  Lock,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react';
import PublicNavbar from '../components/layout/PublicNavbar';

const featureBlocks = [
  {
    icon: FileArrowUp,
    title: 'Data Import Pipeline',
    description: 'Upload CSV/XLSX data, map columns, and generate clean relational tables in minutes.',
    points: ['Schema mapping UI', 'Type inference', 'Large file handling'],
  },
  {
    icon: Sparkle,
    title: 'AI Analysis Workspace',
    description: 'Use natural language prompts to generate SQL, summaries, and practical decision insights.',
    points: ['Prompt-to-query', 'Result explanation', 'Saved analysis history'],
  },
  {
    icon: ChartBar,
    title: 'Visual Analytics Studio',
    description: 'Create reusable charts and compose dashboard canvases for operational reporting.',
    points: ['7 chart types', 'Drag-and-drop canvas', 'PDF export'],
  },
  {
    icon: UsersThree,
    title: 'Team Collaboration',
    description: 'Enable role-aware collaboration across analysts, admins, and management stakeholders.',
    points: ['User management', 'Role assignment', 'Permission model'],
  },
  {
    icon: Lock,
    title: 'Secure Governance',
    description: 'Protect sensitive data through authenticated access and least-privilege controls.',
    points: ['JWT auth', 'RBAC controls', 'Audit-friendly design'],
  },
  {
    icon: Database,
    title: 'Operational Reliability',
    description: 'Run confidently with migrations, health endpoints, and self-hosted or cloud deployment options.',
    points: ['Docker support', 'Health checks', 'Cloud deployment guides'],
  },
];

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-base-content">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">Platform Features</h1>
          <p className="mt-4 text-base sm:text-lg text-base-content/70">
            A complete analytics lifecycle built into one product experience, from ingestion to reporting.
          </p>
        </div>

        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {featureBlocks.map(({ icon: Icon, title, description, points }) => (
            <article key={title} className="ag-card p-5 h-full">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icon size={22} weight="duotone" />
              </div>
              <h2 className="mt-4 text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-base-content/70">{description}</p>
              <ul className="mt-4 space-y-2">
                {points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-base-content/80">
                    <CheckCircle size={14} className="text-success" weight="fill" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-base-300 bg-base-100/80 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-base-content/75">Need implementation details and setup guides?</p>
          <button onClick={() => navigate('/docs')} className="btn btn-primary btn-sm rounded-lg">Open Docs</button>
        </div>
      </main>
    </div>
  );
}
