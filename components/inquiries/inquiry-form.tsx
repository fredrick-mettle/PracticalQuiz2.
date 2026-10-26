"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createInquiryAction } from "@/lib/actions/inquiries";
import {
  inquiryMessageSchema,
  type InquiryMessageValues,
} from "@/lib/validations/inquiry";

interface InquiryFormProps {
  propertyId: string;
  agentName: string;
}

/** "Send an inquiry" form on the public detail page (Phase 8). */
export function InquiryForm({ propertyId, agentName }: InquiryFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ inquiryId: string; appended: boolean } | null>(
    null
  );
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InquiryMessageValues>({
    resolver: zodResolver(inquiryMessageSchema),
    defaultValues: { message: "" },
  });

  async function onSubmit(values: InquiryMessageValues) {
    setServerError(null);
    const result = await createInquiryAction(propertyId, values);
    if (!result.success) {
      setServerError(result.message);
      return;
    }
    setSent({ inquiryId: result.inquiryId, appended: result.appended });
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3.5">
        <p className="text-sm font-semibold text-emerald-900">
          {sent.appended ? "Message sent ✓" : "Inquiry sent ✓"}
        </p>
        <p className="mt-0.5 text-sm leading-6 text-emerald-800">
          {sent.appended
            ? "It was added to your existing conversation with the agent."
            : `${agentName} has been notified and will reply here.`}{" "}
          <Link
            href={`/inquiries/${sent.inquiryId}`}
            className="font-semibold underline underline-offset-2"
          >
            View conversation
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <label
        htmlFor="inquiry-message"
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        Message to {agentName}
      </label>
      <textarea
        id="inquiry-message"
        rows={4}
        placeholder="Hello, is this property still available? I'd like to arrange a viewing…"
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
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-3 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Sending…" : "Send inquiry"}
      </button>
      <p className="mt-2 text-center text-xs text-slate-500">
        The agent is notified by email and will reply in RentGH.
      </p>
    </form>
  );
}
