import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth-helpers";
import {
  getInquiryThread,
  markInquiryRead,
} from "@/lib/services/inquiries";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { InquiryStatusBadge } from "@/components/inquiries/inquiry-status-badge";
import { ThreadView } from "@/components/inquiries/thread-view";
import { ReplyForm } from "@/components/inquiries/reply-form";
import { CloseInquiryButton } from "@/components/inquiries/close-inquiry-button";

export const metadata: Metadata = { title: "Inquiry" };

interface PageProps {
  params: { id: string };
}

export default async function DashboardInquiryThreadPage({
  params,
}: PageProps) {
  const user = await requireRole("AGENT");

  // Opening the thread marks it READ (no-op unless owner + still NEW).
  await markInquiryRead(user.id, params.id);

  const thread = await getInquiryThread(user.id, params.id);
  // Dashboard thread is owner-side only; as a mere sender you'd use
  // /inquiries/[id]. Everything else 404s without leaking existence.
  if (!thread || thread.property.ownerId !== user.id) notFound();

  const cover = thread.property.images[0];
  const closed = thread.status === "CLOSED";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/inquiries"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← All inquiries
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative h-16 w-20 flex-none overflow-hidden rounded-lg bg-slate-100">
          {cover && (
            <Image src={cover.url} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-900">
            Conversation with {thread.sender.name}
          </p>
          <Link
            href={`/properties/${thread.property.id}`}
            className="text-sm text-slate-700 hover:text-emerald-800 hover:underline"
          >
            {thread.property.title}
          </Link>
          <p className="text-sm text-slate-600">
            {formatGHS(thread.property.price)}
            {pricePeriodSuffix(thread.property.pricePeriod)} ·{" "}
            {thread.property.area ? `${thread.property.area}, ` : ""}
            {thread.property.city} — {thread.property.region}
          </p>
        </div>
        <div className="flex flex-none items-center gap-2">
          <InquiryStatusBadge status={thread.status} />
          <CloseInquiryButton inquiryId={thread.id} closed={closed} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <ThreadView thread={thread} currentUserId={user.id} />
      </div>

      {closed ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
          This conversation is closed. Reopen it above to continue.
        </p>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <ReplyForm inquiryId={thread.id} />
        </div>
      )}
    </div>
  );
}
