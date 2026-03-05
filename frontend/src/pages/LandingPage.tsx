import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BrainCircuit,
  BarChart2,
  Database,
  PanelTop,
  ClipboardList,
  Shield,
  ArrowRight,
  BookOpen,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const FEATURES = [
  {
    icon: Database,
    title: 'CSV Data Import',
    desc: 'Upload and parse any CSV dataset instantly. The system auto-detects column types and prepares your data for analysis.',
    color: '#2563eb',
  },
  {
    icon: BrainCircuit,
    title: 'AI Analysis',
    desc: 'Ask questions about your data in plain language. Powered by Groq LLMs, the AI returns structured insights and summaries.',
    color: '#7c3aed',
  },
  {
    icon: BarChart2,
    title: 'Chart Builder',
    desc: 'Create bar, line, pie, radar, polar-area, and doughnut charts from any imported dataset with a few clicks.',
    color: '#0891b2',
  },
  {
    icon: PanelTop,
    title: 'Dashboard Canvas',
    desc: 'Drag, resize, and arrange charts on a free-form canvas. Export the whole dashboard to a PDF report in one click.',
    color: '#059669',
  },
  {
    icon: ClipboardList,
    title: 'Survey Generator',
    desc: 'AI drafts targeted surveys based on your dataset. Copy, share, or embed questions to collect follow-up field data.',
    color: '#d97706',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    desc: 'Assign granular permissions to users via custom roles. Keep sensitive data restricted to the right people.',
    color: '#dc2626',
  },
];

const TECH = ['React 18', 'TypeScript', 'Vite', 'Express.js', 'PostgreSQL', 'Groq LLM', 'Chart.js', 'jsPDF'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--ag-bg)', color: 'var(--ag-text)' }}
    >
      {/* ─── Navbar ─── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-12 py-4"
        style={{
          backdropFilter: 'blur(16px)',
          background: 'var(--ag-sidebar)',
          borderBottom: '1px solid var(--ag-border)',
        }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: 'var(--ag-accent)' }} />
          <span className="font-semibold text-sm tracking-wide text-white/90">ISET Observatory</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ background: 'var(--ag-card)', color: 'var(--ag-text2)' }}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate('/docs')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
            style={{ background: 'var(--ag-card)', color: 'var(--ag-text2)', border: '1px solid var(--ag-border)' }}
          >
            Docs
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{ background: 'var(--ag-accent)', color: '#fff' }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden px-6 md:px-12 pt-28 pb-24 text-center">
        {/* Background bokeh blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, var(--ag-accent), transparent)' }}
          />
          <div
            className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full opacity-15 blur-3xl"
            style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }}
          />
          <div
            className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-10 blur-3xl"
            style={{ background: 'radial-gradient(circle, #0891b2, transparent)' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
            style={{ background: 'var(--ag-accent)22', color: 'var(--ag-accent)', border: '1px solid var(--ag-accent)44' }}
          >
            <Activity className="w-3 h-3" />
            Institutional Data Observatory
          </span>

          <h1
            className="text-5xl md:text-6xl font-extrabold leading-tight mb-6"
            style={{ color: 'var(--ag-text)' }}
          >
            Understand your data
            <br />
            <span style={{ color: 'var(--ag-accent)' }}>intelligently.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-10 max-w-xl mx-auto" style={{ color: 'var(--ag-text2)' }}>
            Import CSVs, query with AI, build beautiful charts, and generate shareable dashboards — all in one
            open-source academic analytics platform.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition hover:opacity-90 shadow-lg"
              style={{ background: 'var(--ag-accent)', color: '#fff' }}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/docs')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition hover:opacity-80"
              style={{ background: 'var(--ag-card)', color: 'var(--ag-text)', border: '1px solid var(--ag-border)' }}
            >
              <BookOpen className="w-4 h-4" /> View Docs
            </button>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="px-6 md:px-12 pb-20">
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold text-center mb-2"
            style={{ color: 'var(--ag-text)' }}
          >
            Everything you need
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--ag-text2)' }}>
            A complete analytics toolkit built for academic institutions.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-2xl p-6 flex flex-col gap-3 transition hover:-translate-y-0.5"
                  style={{
                    background: 'var(--ag-card)',
                    border: '1px solid var(--ag-border)',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: f.color + '1a' }}
                  >
                    <Icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--ag-text)' }}>
                    {f.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── CTA banner ─── */}
      <section className="px-6 md:px-12 pb-20">
        <div
          className="max-w-4xl mx-auto rounded-2xl p-10 text-center relative overflow-hidden"
          style={{ background: 'var(--ag-accent)', color: '#fff' }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-3xl font-extrabold mb-3">Ready to get started?</h2>
            <p className="text-white/80 mb-6 text-sm">
              Sign in with your institutional account or ask your admin to create one.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 rounded-xl font-semibold transition hover:opacity-90 shadow-md"
              style={{ background: '#fff', color: 'var(--ag-accent)' }}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className="px-6 md:px-12 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ borderTop: '1px solid var(--ag-border)' }}
      >
        <div className="flex items-center gap-2" style={{ color: 'var(--ag-text2)' }}>
          <Activity className="w-4 h-4" style={{ color: 'var(--ag-accent)' }} />
          <span className="text-sm font-medium">ISET Observatory</span>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          {TECH.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: 'var(--ag-card)', color: 'var(--ag-text2)', border: '1px solid var(--ag-border)' }}
            >
              {t}
            </span>
          ))}
        </div>
        <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>
          © {new Date().getFullYear()} ISET
        </span>
      </footer>
    </div>
  );
}
