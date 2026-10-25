import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth-helpers";
import { getInquiryThread } from "@/lib/services/inquiries";
import { formatGHS, pricePeriodSuffix } from "@/lib/utils";
import { InquiryStatusBadge } from "@/components/inquiries/inquiry-status-badge";
import { ThreadView } from "@/components/inquiries/thread-view";
import { ReplyForm } from "@/components/inquiries/reply-form";

export const metadata: Metadata = { title: "Conversation" };

interface PageProps {
  params: { id: string };
}

export default async function InquiryThreadPage({ params }: PageProps) {
  const user = await requireUser();

  // Participants only — everyone else gets a plain 404.
  const thread = await getInquiryThread(user.id, params.id);
  if (!thread) notFound();

  const cover = thread.property.images[0];
  const closed = thread.status === "CLOSED";
  const otherName =
    user.id === thread.senderId
      ? thread.property.owner.name
      : thread.sender.name;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/inquiries"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← My inquiries
      </Link>

      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative h-16 w-20 flex-none overflow-hidden rounded-lg bg-slate-100">
          {cover && (
            <Image src={cover.url} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`/properties/${thread.property.id}`}
            className="font-semibold text-slate-900 hover:text-emerald-800 hover:underline"
          >
            {thread.property.title}
          </Link>
          <p className="text-sm text-slate-600">
            {formatGHS(thread.property.price)}
            {pricePeriodSuffix(thread.property.pricePeriod)} ·{" "}
            {thread.property.area ? `${thread.property.area}, ` : ""}
            {thread.property.city} — {thread.property.region}
          </p>
          <p className="text-sm text-slate-600">
            Conversation with {otherName}
          </p>
        </div>
        <InquiryStatusBadge status={thread.status} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
        <ThreadView thread={thread} currentUserId={user.id} />
      </div>

      {closed ? (
        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
          This conversation has been closed. You can start a new inquiry
          from the property page.
        </p>
      ) : (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <ReplyForm inquiryId={thread.id} />
        </div>
      )}
    </div>
  );
}
