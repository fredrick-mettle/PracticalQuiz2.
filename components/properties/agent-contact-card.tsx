"use client";

import { useState } from "react";

interface AgentContactCardProps {
  name: string;
  phone: string;
  /** Preformatted on the server, e.g. "Oct 2026". */
  memberSince: string;
}

/** Ghana numbers are stored as +233XXXXXXXXX. */
function prettyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("233")) {
    return `+233 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return phone;
}

function maskedPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("233")) {
    return `+233 ${digits.slice(3, 5)} ••• ••${digits.slice(-2)}`;
  }
  return "••• ••• ••••";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * "Listed by" block on the detail page. The full number is revealed on
 * click (basic anti-scrape courtesy) with call / WhatsApp actions.
 */
export function AgentContactCard({
  name,
  phone,
  memberSince,
}: AgentContactCardProps) {
  const [revealed, setRevealed] = useState(false);
  const digits = phone.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${digits}?text=${encodeURIComponent(
    "Hello, I saw your property on RentGH and I'm interested. Is it still available?"
  )}`;

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-800"
          aria-hidden="true"
        >
          {initials(name)}
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            Agent / Landlord · On RentGH since {memberSince}
          </p>
        </div>
      </div>

      <p className="mt-4 text-lg font-semibold tracking-wide text-slate-900">
        {revealed ? prettyPhone(phone) : maskedPhone(phone)}
      </p>

      {revealed ? (
        <div className="mt-3 flex gap-2">
          <a
            href={`tel:${phone}`}
            className="flex-1 rounded-lg bg-emerald-700 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Call now
          </a>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-lg border border-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            WhatsApp
          </a>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Show phone number
        </button>
      )}
      <p className="mt-2.5 text-center text-xs text-slate-500">
        Mention RentGH when you call.
      </p>
    </div>
  );
}
