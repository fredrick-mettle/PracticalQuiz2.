import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { listSentInquiries } from "@/lib/services/inquiries";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { InquiryStatusBadge } from "@/components/inquiries/inquiry-status-badge";

export const metadata: Metadata = { title: "My Inquiries" };

function formatWhen(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function MyInquiriesPage() {
  const user = await requireUser();
  const inquiries = await listSentInquiries(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        My Inquiries
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        {inquiries.length}{" "}
        {inquiries.length === 1 ? "conversation" : "conversations"} with
        agents
      </p>

      {inquiries.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="text-lg font-semibold text-slate-800">
            No inquiries yet
          </p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-slate-600">
            When you contact an agent about a property, your conversation
            will live here.
          </p>
          <Link
            href="/properties"
            className="mt-5 inline-block rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            Browse properties
          </Link>
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
            const messageCount = 1 + inquiry._count.replies;
            return (
              <li key={inquiry.id}>
                <Link
                  href={`/inquiries/${inquiry.id}`}
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
                      <p className="truncate font-semibold text-slate-900">
                        {inquiry.property.title}
                      </p>
                      <InquiryStatusBadge status={inquiry.status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {formatGHS(inquiry.property.price)}
                      {pricePeriodSuffix(inquiry.property.pricePeriod)} ·{" "}
                      {inquiry.property.city}, {inquiry.property.region} ·
                      Agent: {inquiry.property.owner.name}
                    </p>
                    <p className="mt-1.5 truncate text-sm text-slate-600">
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
