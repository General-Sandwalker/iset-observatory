import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <header className="ag-card px-5 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 text-slate-900 flex items-center justify-center shadow-lg shadow-teal-700/30">
            {icon}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-base-content/70 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
