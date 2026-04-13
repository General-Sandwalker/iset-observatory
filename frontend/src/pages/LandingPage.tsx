import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle,
  ChartBar,
  Database,
  Lock,
  Sparkle,
  UsersThree,
} from '@phosphor-icons/react';
import PublicNavbar from '../components/layout/PublicNavbar';

const stats = [
  { label: 'Datasets imported', value: '128' },
  { label: 'AI analyses', value: '2,914' },
  { label: 'Dashboards', value: '47' },
  { label: 'Active users', value: '132' },
];

const features = [
  {
    icon: Database,
    title: 'Ingest Any Dataset',
    description: 'Upload CSV/XLSX files, map columns, and publish structured tables quickly.',
  },
  {
    icon: Sparkle,
    title: 'Analyze with AI',
    description: 'Ask business questions in natural language and receive actionable insights.',
  },
  {
    icon: ChartBar,
    title: 'Build Charts and Dashboards',
    description: 'Create polished visuals and export reports for stakeholders and leadership.',
  },
  {
    icon: UsersThree,
    title: 'Collaborate Securely',
    description: 'Control data visibility with role-based permissions and account governance.',
  },
  {
    icon: Lock,
    title: 'Production Ready',
    description: 'Deploy via Docker, Railway, and Vercel with enterprise-friendly architecture.',
  },
  {
    icon: CheckCircle,
    title: 'Operationally Reliable',
    description: 'Use health checks, migrations, and resilient APIs built for day-to-day use.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-base-content">
      <PublicNavbar />

      <main>
        <section className="relative overflow-hidden py-14 sm:py-18 lg:py-22">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute right-[-100px] top-[20%] h-[280px] w-[280px] rounded-full bg-indigo-400/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/75 px-4 py-1.5 text-xs font-semibold tracking-wide">
                <Sparkle size={14} weight="duotone" />
                Modern analytics suite for institutions
              </span>

              <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] tracking-tight">
                Empower Your Team With
                <br />
                Smarter Data Insights
              </h1>

              <p className="mt-6 text-base sm:text-lg text-base-content/75 max-w-2xl mx-auto leading-relaxed">
                Unify data import, AI analysis, charting, dashboards, and governance in one platform
                designed for clarity, speed, and decision-making.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button onClick={() => navigate('/login')} className="btn btn-primary rounded-xl px-6">
                  Get Started
                  <ArrowRight size={15} />
                </button>
                <button onClick={() => navigate('/docs')} className="btn btn-outline rounded-xl px-6">
                  View Documentation
                </button>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-base-300/80 bg-base-100/80 p-3 sm:p-4 shadow-[0_28px_70px_rgba(15,23,42,0.18)] backdrop-blur">
              <div className="overflow-hidden rounded-2xl border border-base-300/70 bg-base-100">
                <img
                  src="https://images.unsplash.com/photo-1551281044-8d8d9f6a1f1c?auto=format&fit=crop&w=1800&q=80"
                  alt="Platform dashboard preview"
                  className="h-56 sm:h-72 lg:h-[25rem] w-full object-cover"
                />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-5">
                  {stats.map((s) => (
                    <div key={s.label} className="rounded-xl border border-base-300 bg-base-200/60 px-3 py-2.5">
                      <p className="text-xs text-base-content/65">{s.label}</p>
                      <p className="text-2xl font-semibold mt-1">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold">Everything your data workflow needs</h2>
              <p className="text-base-content/70 mt-2">From ingestion to export, built as one cohesive product.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {features.map(({ icon: Icon, title, description }) => (
                <article key={title} className="ag-card p-5 transition hover:-translate-y-0.5 hover:shadow-xl">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Icon size={22} weight="duotone" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-base-content/70 leading-relaxed">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 lg:py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-10 sm:px-10 lg:px-14 lg:py-14 shadow-2xl shadow-teal-700/30">
              <div className="grid lg:grid-cols-[1fr_auto] items-center gap-6">
                <div>
                  <h2 className="text-3xl font-semibold">Ready to modernize your analytics stack?</h2>
                  <p className="mt-3 text-white/85 max-w-2xl">
                    Launch a secure workspace for your team and go from raw spreadsheets to executive dashboards.
                  </p>
                </div>
                <button onClick={() => navigate('/login')} className="btn rounded-xl border-0 bg-white text-slate-900 hover:bg-slate-100 px-6">
                  Start Free Trial
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
