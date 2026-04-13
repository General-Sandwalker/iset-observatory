import { EnvelopeSimple, Globe, MapPinLine } from '@phosphor-icons/react';
import PublicNavbar from '../components/layout/PublicNavbar';

export default function ContactPage() {
  return (
    <div className="min-h-screen text-base-content">
      <PublicNavbar />
      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <section className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">Contact</h1>
          <p className="mt-4 text-base sm:text-lg text-base-content/70">
            Reach out for deployment support, collaboration inquiries, or product feedback.
          </p>
        </section>

        <section className="mt-10 grid md:grid-cols-2 gap-5">
          <article className="ag-card p-6">
            <h2 className="text-xl font-semibold">Get in touch</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="flex items-center gap-2 text-base-content/80">
                <EnvelopeSimple size={16} className="text-primary" />
                contact@iset-observatory.tn
              </p>
              <p className="flex items-center gap-2 text-base-content/80">
                <MapPinLine size={16} className="text-primary" />
                ISET Tozeur, Tunisia
              </p>
              <p className="flex items-center gap-2 text-base-content/80">
                <Globe size={16} className="text-primary" />
                https://iset-observatory.vercel.app
              </p>
            </div>
          </article>

          <article className="ag-card p-6">
            <h2 className="text-xl font-semibold">Send a message</h2>
            <form className="mt-4 space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input className="input input-bordered w-full rounded-lg" placeholder="Your name" />
              <input className="input input-bordered w-full rounded-lg" placeholder="Email address" type="email" />
              <textarea className="textarea textarea-bordered w-full rounded-lg" rows={5} placeholder="How can we help?" />
              <button className="btn btn-primary rounded-lg">Submit request</button>
            </form>
          </article>
        </section>
      </main>
    </div>
  );
}
