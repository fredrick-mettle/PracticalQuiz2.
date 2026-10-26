import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Shared centered card layout for the login/register pages. */
export function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      <div className="mt-6">{children}</div>
      {footer && (
        <div className="mt-6 border-t border-slate-100 pt-4 text-center text-sm text-slate-600">
          {footer}
        </div>
      )}
    </div>
  );
}
