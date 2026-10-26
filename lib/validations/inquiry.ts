import { z } from "zod";

/** First message of an inquiry conversation (Phase 8). */
export const inquiryMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters so the agent can help you")
    .max(2000, "Message is too long (max 2,000 characters)"),
});

export type InquiryMessageValues = z.infer<typeof inquiryMessageSchema>;

/** Follow-up message inside an existing thread. */
export const replyMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Write a reply first")
    .max(2000, "Message is too long (max 2,000 characters)"),
});

export type ReplyMessageValues = z.infer<typeof replyMessageSchema>;
