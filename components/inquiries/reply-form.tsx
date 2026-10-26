"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { replyToInquiryAction } from "@/lib/actions/inquiries";
import {
  replyMessageSchema,
  type ReplyMessageValues,
} from "@/lib/validations/inquiry";

/** Reply box used by both sides of an inquiry thread (Phase 8). */
export function ReplyForm({ inquiryId }: { inquiryId: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReplyMessageValues>({
    resolver: zodResolver(replyMessageSchema),
    defaultValues: { message: "" },
  });

  async function onSubmit(values: ReplyMessageValues) {
    setServerError(null);
    const result = await replyToInquiryAction(inquiryId, values);
    if (!result.success) {
      setServerError(result.message);
      return;
    }
    reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label htmlFor="reply-message" className="sr-only">
        Write a reply
      </label>
      <textarea
        id="reply-message"
        rows={3}
        placeholder="Write a reply…"
        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
        {...register("message")}
      />
      {errors.message && (
        <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
      )}
      {serverError && (
        <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </p>
      )}
      <div className="mt-2.5 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Sending…" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
