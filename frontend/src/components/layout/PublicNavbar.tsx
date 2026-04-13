import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Gauge, List, X } from '@phosphor-icons/react';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/features', label: 'Features' },
  { to: '/docs', label: 'Docs' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-base-300/70 bg-base-100/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-3">
        <button onClick={() => navigate('/')} className="inline-flex items-center gap-2.5 shrink-0">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-900 shadow-lg shadow-teal-700/30">
            <Gauge size={20} weight="duotone" />
          </span>
          <span className="text-left hidden sm:block">
            <span className="block text-sm font-semibold leading-none">ISET Observatory</span>
            <span className="block text-xs text-base-content/60 mt-1">Analytics Platform</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-primary/15 text-primary font-semibold'
                    : 'text-base-content/75 hover:text-base-content hover:bg-base-200/70'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <button onClick={() => navigate('/login')} className="btn btn-ghost btn-sm rounded-lg">Login</button>
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm rounded-lg">Start Free Trial</button>
        </div>

        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setOpen((v) => !v)}
            className="btn btn-ghost btn-sm btn-square rounded-lg"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <List size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-base-300/70 bg-base-100/95 px-4 pb-4 pt-3">
          <div className="space-y-1">
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg text-sm transition ${
                    isActive
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-base-content/75 hover:text-base-content hover:bg-base-200/70'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button onClick={() => { setOpen(false); navigate('/login'); }} className="btn btn-ghost btn-sm rounded-lg">
              Login
            </button>
            <button onClick={() => { setOpen(false); navigate('/login'); }} className="btn btn-primary btn-sm rounded-lg">
              Start Trial
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
