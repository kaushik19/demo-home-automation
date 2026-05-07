import { ReactNode } from "react";

interface Props {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}

export function Card({ title, subtitle, action, children, className = "", padded = true }: Props) {
  return (
    <section className={`bg-surface rounded-2xl shadow-card ${padded ? "p-5" : ""} ${className}`}>
      {(title || action) && (
        <header className={`flex items-start justify-between gap-3 ${padded ? "" : "p-5 pb-0"} mb-4`}>
          <div>
            {title && <h3 className="text-base font-semibold text-brand-500">{title}</h3>}
            {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
