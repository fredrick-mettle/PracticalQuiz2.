import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import {
  countAgentInquiriesByStatus,
  listReceivedInquiries,
} from "@/lib/services/inquiries";
import { INQUIRY_STATUSES, INQUIRY_STATUS_LABELS } from "@/lib/constants";
import { InquiryStatusBadge } from "@/components/inquiries/inquiry-status-badge";
import type { InquiryStatus } from "@/lib/generated/prisma/enums";

export const metadata: Metadata = { title: "Inquiries" };

interface PageProps {
  searchParams: { status?: string };
}

function parseStatus(raw?: string): InquiryStatus | undefined {
  return INQUIRY_STATUSES.includes(raw as InquiryStatus)
    ? (raw as InquiryStatus)
    : undefined;
}

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardInquiriesPage({
  searchParams,
}: PageProps) {
  const user = await requireRole("AGENT");
  const status = parseStatus(searchParams.status);

  const [counts, inquiries] = await Promise.all([
    countAgentInquiriesByStatus(user.id),
    listReceivedInquiries(user.id, status),
  ]);
  const totalAll = Object.values(counts).reduce((a, b) => a + b, 0);

  const tabs: { label: string; status?: InquiryStatus; count: number }[] = [
    { label: "All", count: totalAll },
    ...INQUIRY_STATUSES.map((s) => ({
      label: INQUIRY_STATUS_LABELS[s],
      status: s as InquiryStatus,
      count: counts[s],
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← My listings
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
        Inquiries
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Conversations from tenants about your listings
        {counts.NEW > 0 && (
          <>
            {" "}
            ·{" "}
            <span className="font-semibold text-amber-700">
              {counts.NEW} new
            </span>
          </>
        )}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = (tab.status ?? undefined) === status;
          return (
            <Link
              key={tab.label}
              href={
                tab.status
                  ? `/dashboard/inquiries?status=${tab.status}`
                  : "/dashboard/inquiries"
              }
              className={
                active
                  ? "rounded-full bg-emerald-700 px-3.5 py-1.5 text-sm font-medium text-white"
                  : "rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              }
            >
              {tab.label}{" "}
              <span className={active ? "text-emerald-200" : "text-slate-400"}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-800">
            {totalAll === 0
              ? "No inquiries yet"
              : "Nothing in this tab"}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            {totalAll === 0
              ? "When tenants ask about your properties, their messages will appear here — you'll also get an email for each one."
              : "Try a different status tab above."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {inquiries.map((inquiry) => {
            const cover = inquiry.property.images[0];
            const last = inquiry.replies[0] ?? {
              message: inquiry.message,
              senderId: inquiry.senderId,
              createdAt: inquiry.createdAt,
            };
            const isNew = inquiry.status === "NEW";
            const messageCount = 1 + inquiry._count.replies;
            return (
              <li key={inquiry.id}>
                <Link
                  href={`/dashboard/inquiries/${inquiry.id}`}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="relative h-20 w-24 flex-none overflow-hidden rounded-lg bg-slate-100">
                    {cover && (
                      <Image
                        src={cover.url}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p
                        className={`flex items-center gap-2 truncate text-slate-900 ${
                          isNew ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {isNew && (
                          <span
                            className="h-2 w-2 flex-none rounded-full bg-amber-500"
                            aria-label="Unread"
                          />
                        )}
                        {inquiry.sender.name}
                      </p>
                      <InquiryStatusBadge status={inquiry.status} />
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      Re: {inquiry.property.title} · {inquiry.property.city},{" "}
                      {inquiry.property.region}
                    </p>
                    <p
                      className={`mt-1.5 truncate text-sm ${
                        isNew
                          ? "font-medium text-slate-800"
                          : "text-slate-600"
                      }`}
                    >
                      <span className="font-medium text-slate-500">
                        {last.senderId === user.id ? "You: " : ""}
                      </span>
                      {last.message}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {messageCount}{" "}
                      {messageCount === 1 ? "message" : "messages"} · Last
                      activity {formatWhen(inquiry.updatedAt)}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
