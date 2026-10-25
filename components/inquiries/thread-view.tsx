import type { InquiryThread } from "@/lib/services/inquiries";

function formatWhen(date: Date): string {
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Chat-style message list for an inquiry thread (Phase 8).
 * The initial inquiry message is followed by all replies in order;
 * the current user's messages align right.
 */
export function ThreadView({
  thread,
  currentUserId,
}: {
  thread: InquiryThread;
  currentUserId: string;
}) {
  const messages = [
    {
      key: "initial",
      senderId: thread.senderId,
      senderName: thread.sender.name,
      message: thread.message,
      createdAt: thread.createdAt,
    },
    ...thread.replies.map((reply) => ({
      key: reply.id,
      senderId: reply.senderId,
      senderName: reply.sender.name,
      message: reply.message,
      createdAt: reply.createdAt,
    })),
  ];

  return (
    <ol className="space-y-3">
      {messages.map((msg) => {
        const mine = msg.senderId === currentUserId;
        return (
          <li
            key={msg.key}
            className={`flex ${mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 sm:max-w-[75%] ${
                mine
                  ? "rounded-br-md bg-emerald-700 text-white"
                  : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
              }`}
            >
              <p
                className={`text-xs font-semibold ${
                  mine ? "text-emerald-100" : "text-slate-500"
                }`}
              >
                {mine ? "You" : msg.senderName} · {formatWhen(msg.createdAt)}
              </p>
              <p className="mt-1 whitespace-pre-line text-sm leading-6">
                {msg.message}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
