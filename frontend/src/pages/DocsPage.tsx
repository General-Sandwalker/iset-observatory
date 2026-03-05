import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  LogIn,
  Database,
  BrainCircuit,
  BarChart2,
  PanelTop,
  ClipboardList,
  Settings,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Section {
  id: string;
  step: number;
  icon: typeof LogIn;
  color: string;
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl mt-4"
      style={{ background: 'var(--ag-accent)0d', border: '1px solid var(--ag-accent)33' }}
    >
      <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--ag-accent)' }} />
      <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>{children}</p>
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre
      className="text-xs leading-relaxed p-4 rounded-xl overflow-x-auto mt-3"
      style={{ background: 'var(--ag-sidebar)', color: '#7dd3fc', border: '1px solid var(--ag-border)' }}
    >
      <code>{children}</code>
    </pre>
  );
}

function Step({ n, color, children }: { n: number; color: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 items-start mt-4">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: color + '22', color }}
      >
        {n}
      </div>
      <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--ag-text2)' }}>{children}</p>
    </div>
  );
}

function VisualCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4 mt-4"
      style={{ background: 'var(--ag-card)', border: '1px solid var(--ag-border)' }}
    >
      <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--ag-text3)' }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const SECTIONS: Omit<Section, 'content'>[] = [
  { id: 'login',      step: 1, icon: LogIn,       color: '#2563eb', title: 'Sign In',          subtitle: 'Access the platform' },
  { id: 'import',     step: 2, icon: Database,     color: '#0891b2', title: 'Import Data',      subtitle: 'Upload your CSV' },
  { id: 'ai',         step: 3, icon: BrainCircuit, color: '#7c3aed', title: 'AI Analysis',      subtitle: 'Chat with your data' },
  { id: 'charts',     step: 4, icon: BarChart2,    color: '#059669', title: 'Chart Builder',    subtitle: 'Visualise your data' },
  { id: 'dashboards', step: 5, icon: PanelTop,     color: '#d97706', title: 'Dashboards',       subtitle: 'Build & export reports' },
  { id: 'surveys',    step: 6, icon: ClipboardList, color: '#db2777', title: 'Survey Generator', subtitle: 'Create field studies' },
  { id: 'settings',   step: 7, icon: Settings,     color: '#64748b', title: 'Settings',         subtitle: 'Customise your account' },
];

function sectionContent(id: string, color: string): React.ReactNode {
  switch (id) {
    case 'login':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            Open the Observatory in your browser and enter your institutional email and password. Your system
            administrator will have created your account and assigned you a role.
          </p>
          <VisualCard label="Login form fields">
            <div className="space-y-2">
              {['Email address', 'Password'].map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: 'var(--ag-bg)', border: '1px solid var(--ag-border)', color: 'var(--ag-text3)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} /> {f}
                </div>
              ))}
              <div
                className="px-3 py-2 rounded-lg text-xs text-center font-semibold mt-2"
                style={{ background: color, color: '#fff' }}
              >
                Sign In
              </div>
            </div>
          </VisualCard>
          <Tip>If you see a 401 error, your token has expired. Logging out and back in will refresh it.</Tip>
        </>
      );
    case 'import':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            Navigate to <strong style={{ color: 'var(--ag-text)' }}>Data Import</strong> in the sidebar. Drop a
            CSV file onto the upload zone or click to browse. The backend will parse the file, detect column
            types, and store the data in a dynamic table.
          </p>
          <Step n={1} color={color}>Drag your <code className="px-1 rounded text-xs" style={{ background: 'var(--ag-sidebar)', color: '#7dd3fc' }}>.csv</code> file onto the upload area.</Step>
          <Step n={2} color={color}>The parser validates headers and infers data types (number, text, date).</Step>
          <Step n={3} color={color}>Once imported, the dataset appears in the datasets list with row/column counts.</Step>
          <VisualCard label="Supported formats">
            <div className="flex gap-2 flex-wrap">
              {['UTF-8 CSV', 'Comma-separated', 'Header row required', 'Max 50 MB'].map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-xs"
                  style={{ background: color + '1a', color }}
                >
                  {t}
                </span>
              ))}
            </div>
          </VisualCard>
          <Tip>Keep the first row as a clean header — no spaces in column names works best with the AI queries.</Tip>
        </>
      );
    case 'ai':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            Go to <strong style={{ color: 'var(--ag-text)' }}>AI Analysis</strong>. Select a dataset, then
            type a natural-language question. The Groq LLM interprets your question, generates a structured
            JSON response with a summary, key insights, and chart suggestions.
          </p>
          <Step n={1} color={color}>Choose the dataset from the dropdown.</Step>
          <Step n={2} color={color}>Type your question in plain language.</Step>
          <Step n={3} color={color}>The AI returns a summary, bullet insights, and chart recommendations.</Step>

          <VisualCard label="Example AI queries">
            <div className="space-y-2">
              {[
                'What is the average employment rate by major?',
                'Which course has the highest failure rate?',
                'Show me trends in student enrollment over time.',
                'Summarise the key findings from this dataset.',
              ].map((q) => (
                <div
                  key={q}
                  className="flex items-start gap-2 text-xs p-2 rounded-lg"
                  style={{ background: 'var(--ag-bg)', border: '1px solid var(--ag-border)' }}
                >
                  <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color }} />
                  <span style={{ color: 'var(--ag-text2)' }}>{q}</span>
                </div>
              ))}
            </div>
          </VisualCard>
          <Code>{`// The AI responds with structured JSON
{
  "summary": "The average employment rate across all majors is 72%…",
  "insights": [
    "Computer Science has the highest rate at 91%",
    "Liberal Arts shows a downward trend since 2021"
  ],
  "chartSuggestion": {
    "type": "bar",
    "xAxis": "major",
    "yAxis": "employment_rate"
  }
}`}</Code>
          <Tip>The AI reads the first 100 rows as a sample. If your dataset has patterns in later rows, mention that in your query.</Tip>
        </>
      );
    case 'charts':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            Open <strong style={{ color: 'var(--ag-text)' }}>Chart Builder</strong>. Choose a dataset, pick
            chart type, then select which columns to use as the label and value axes. Save the chart — it will
            be available for placement on a Dashboard.
          </p>
          <VisualCard label="Available chart types">
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'Bar', icon: '▬' },
                { type: 'Line', icon: '╱' },
                { type: 'Pie', icon: '◕' },
                { type: 'Doughnut', icon: '◎' },
                { type: 'Radar', icon: '✦' },
                { type: 'Polar Area', icon: '◑' },
              ].map(({ type, icon }) => (
                <div
                  key={type}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg text-xs"
                  style={{ background: 'var(--ag-bg)', border: '1px solid var(--ag-border)' }}
                >
                  <span className="text-lg">{icon}</span>
                  <span style={{ color: 'var(--ag-text2)' }}>{type}</span>
                </div>
              ))}
            </div>
          </VisualCard>
          <Step n={1} color={color}>Select your dataset and give the chart a descriptive title.</Step>
          <Step n={2} color={color}>Choose the chart type that best represents your data relationship.</Step>
          <Step n={3} color={color}>Map columns to Label (X-axis) and Value (Y-axis).</Step>
          <Step n={4} color={color}>Click <em>Save Chart</em>. The chart is stored and ready for dashboards.</Step>
          <Tip>For categorical comparisons (e.g. grades by department), Bar charts work best. For proportions, use Pie or Doughnut.</Tip>
        </>
      );
    case 'dashboards':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            Go to <strong style={{ color: 'var(--ag-text)' }}>Dashboards</strong>. Create a new dashboard,
            then add saved charts from the <em>Add Chart</em> panel. Drag them to rearrange and resize
            freely. When ready, export to PDF.
          </p>
          <Step n={1} color={color}>Click <em>New Dashboard</em> and give it a name.</Step>
          <Step n={2} color={color}>Use the panel on the right to add charts to the canvas.</Step>
          <Step n={3} color={color}>Drag cards to rearrange and use the resize handle at the bottom-right.</Step>
          <Step n={4} color={color}>Click <em>Export PDF</em> to download a formatted A4 landscape report.</Step>
          <VisualCard label="PDF export includes">
            <ul className="space-y-1">
              {['Dashboard title & export timestamp', 'Data table for each chart (up to 30 rows)', 'Striped formatting & column headers'].map((i) => (
                <li key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--ag-text2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  {i}
                </li>
              ))}
            </ul>
          </VisualCard>
          <Tip>Give charts short, descriptive titles — they appear as headings in the exported PDF.</Tip>
        </>
      );
    case 'surveys':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            The <strong style={{ color: 'var(--ag-text)' }}>Survey Generator</strong> uses your imported data
            to draft targeted survey questions via AI. Use these to collect follow-up data from students,
            alumni, or staff.
          </p>
          <Step n={1} color={color}>Open Survey Generator and select a dataset as the context.</Step>
          <Step n={2} color={color}>Describe what you want to learn (e.g. "alumni career satisfaction").</Step>
          <Step n={3} color={color}>The AI generates 5–10 structured survey questions.</Step>
          <Step n={4} color={color}>Copy the generated questions into your preferred survey tool.</Step>
          <Tip>The AI tailors questions to the columns in your dataset. A dataset with employment data will generate job-related questions automatically.</Tip>
        </>
      );
    case 'settings':
      return (
        <>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ag-text2)' }}>
            In <strong style={{ color: 'var(--ag-text)' }}>Settings</strong>, you can update your display
            name, email, change your password, and toggle between the dark and light aerogel themes. Your
            preferences are saved to your account.
          </p>
          <VisualCard label="Settings sections">
            <div className="space-y-2">
              {[
                { label: 'Profile', desc: 'Update your name and email' },
                { label: 'Password', desc: 'Change your login password' },
                { label: 'Theme', desc: 'Switch between Dark and Light modes' },
                { label: 'App Info', desc: 'Version and support details' },
              ].map(({ label, desc }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--ag-bg)', border: '1px solid var(--ag-border)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <div>
                    <p className="text-xs font-medium" style={{ color: 'var(--ag-text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--ag-text3)' }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </VisualCard>
          <Tip>Theme preference is stored in your account, so it follows you across devices when you log in.</Tip>
        </>
      );
    default:
      return null;
  }
}

export default function DocsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [active, setActive] = useState('login');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--ag-bg)', color: 'var(--ag-text)' }}>
      {/* ─── Navbar ─── */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          backdropFilter: 'blur(16px)',
          background: 'var(--ag-sidebar)',
          borderBottom: '1px solid var(--ag-border)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          <Activity className="w-5 h-5" style={{ color: 'var(--ag-accent)' }} />
          <span className="font-semibold text-sm tracking-wide text-white/90">ISET Observatory</span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg transition hover:opacity-80"
            style={{ background: 'var(--ag-card)', color: 'var(--ag-text2)' }}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition hover:opacity-90"
            style={{ background: 'var(--ag-accent)', color: '#fff' }}
          >
            Sign In <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12 flex gap-8">
        {/* ─── Sidebar TOC ─── */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0">
          <div className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--ag-text3)' }}>
              Tutorial
            </p>
            {SECTIONS.map(({ id, step, color, title }) => (
              <a
                key={id}
                href={`#${id}`}
                onClick={(e) => { e.preventDefault(); sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth' }); }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition"
                style={{
                  color: active === id ? color : 'var(--ag-text2)',
                  background: active === id ? color + '15' : 'transparent',
                  fontWeight: active === id ? 600 : 400,
                }}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: color + '22', color }}
                >
                  {step}
                </span>
                {title}
              </a>
            ))}
          </div>
        </aside>

        {/* ─── Main content ─── */}
        <main className="flex-1 min-w-0 space-y-16">
          {/* Intro */}
          <div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ background: 'var(--ag-accent)22', color: 'var(--ag-accent)', border: '1px solid var(--ag-accent)44' }}
            >
              Documentation
            </span>
            <h1 className="text-4xl font-extrabold mb-3" style={{ color: 'var(--ag-text)' }}>
              Getting Started
            </h1>
            <p className="text-base leading-relaxed max-w-2xl" style={{ color: 'var(--ag-text2)' }}>
              This guide walks you through every feature of ISET Observatory — from logging in to exporting
              polished PDF reports. Follow the steps in order for the best experience.
            </p>
          </div>

          {/* Sections */}
          {SECTIONS.map(({ id, step, icon: Icon, color, title, subtitle }) => (
            <section
              key={id}
              id={id}
              ref={(el) => { sectionRefs.current[id] = el; }}
              className="scroll-mt-24"
            >
              {/* Section header */}
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: color + '1a' }}
                >
                  <Icon className="w-6 h-6" style={{ color }} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color + '1a', color }}
                    >
                      Step {step}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--ag-text3)' }}>{subtitle}</span>
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ag-text)' }}>{title}</h2>
                </div>
              </div>

              {/* Section body */}
              <div
                className="rounded-2xl p-6"
                style={{ background: 'var(--ag-card)', border: '1px solid var(--ag-border)' }}
              >
                {sectionContent(id, color)}
              </div>
            </section>
          ))}

          {/* End CTA */}
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--ag-accent)', color: '#fff' }}
          >
            <h2 className="text-2xl font-extrabold mb-2">You're all set!</h2>
            <p className="text-white/80 text-sm mb-5">
              Sign in to start importing data and running AI-powered analyses.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
              style={{ background: '#fff', color: 'var(--ag-accent)' }}
            >
              Go to Sign In
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
