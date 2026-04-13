import PublicNavbar from '../components/layout/PublicNavbar';

export default function AboutPage() {
  return (
    <div className="min-h-screen text-base-content">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <section className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">About ISET Observatory</h1>
          <p className="mt-4 text-base sm:text-lg text-base-content/70 leading-relaxed">
            ISET Observatory was designed to help institutions move from fragmented spreadsheets to trusted,
            decision-ready analytics. It combines ingestion, AI analysis, visualization, and governance into one workspace.
          </p>
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-5">
          <article className="ag-card p-6">
            <h2 className="text-xl font-semibold">Our Mission</h2>
            <p className="mt-3 text-sm text-base-content/70 leading-relaxed">
              Enable teams to produce transparent, high-quality insights faster by reducing manual analysis effort
              and improving consistency across reporting workflows.
            </p>
          </article>
          <article className="ag-card p-6">
            <h2 className="text-xl font-semibold">What We Value</h2>
            <p className="mt-3 text-sm text-base-content/70 leading-relaxed">
              Readability, reliability, and practical workflows. Every module is built to be understandable,
              maintainable, and production-ready for real institutional use.
            </p>
          </article>
        </section>

        <section className="mt-10 ag-card p-6">
          <h2 className="text-xl font-semibold">Technology Foundation</h2>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {['React + TypeScript', 'Tailwind + DaisyUI', 'Express + PostgreSQL', 'Groq-powered AI'].map((item) => (
              <div key={item} className="rounded-lg border border-base-300 bg-base-200/50 px-3 py-2">
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
