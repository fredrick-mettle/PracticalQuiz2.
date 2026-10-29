import type { ReactNode } from "react";
import Link from "next/link";

export const SUPPORT_EMAIL = "oforimettlefredrick@gmail.com";
export const SUPPORT_PHONE_DISPLAY = "054 112 2652";
export const SUPPORT_PHONE_TEL = "+233541122652";
export const LEGAL_LAST_UPDATED = "29 October 2026";

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}

export function SupportEmailLink() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}`}
      className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
    >
      {SUPPORT_EMAIL}
    </a>
  );
}

export function SupportPhoneLink() {
  return (
    <a
      href={`tel:${SUPPORT_PHONE_TEL}`}
      className="font-semibold text-emerald-800 underline-offset-2 hover:underline"
    >
      {SUPPORT_PHONE_DISPLAY}
    </a>
  );
}

export function LegalPage({ eyebrow, title, intro, children }: LegalPageProps) {
  return (
    <main className="bg-white">
      <article className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">{intro}</p>
        <p className="mt-3 text-sm text-slate-500">
          Last updated: {LEGAL_LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-10">{children}</div>

        <aside className="mt-12 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-5 sm:px-6">
          <h2 className="text-base font-bold text-emerald-950">
            Contact RentGH
          </h2>
          <p className="mt-2 text-sm leading-6 text-emerald-900">
            For account, privacy, safety, or listing concerns, call{" "}
            <SupportPhoneLink /> or email <SupportEmailLink />. Include the
            listing link and enough detail for the administrator to identify
            the issue.
          </p>
          <nav
            aria-label="Legal and safety pages"
            className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-emerald-800"
          >
            <Link href="/safety" className="underline-offset-2 hover:underline">
              Safety tips
            </Link>
            <Link href="/terms" className="underline-offset-2 hover:underline">
              Terms of Use
            </Link>
            <Link href="/privacy" className="underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
          </nav>
        </aside>
      </article>
    </main>
  );
}

interface LegalSectionProps {
  title: string;
  children: ReactNode;
}

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <div className="mt-3 space-y-3 leading-7 text-slate-700">{children}</div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
