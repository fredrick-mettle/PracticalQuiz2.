import { z } from "zod";
import { USER_STATUSES } from "@/lib/constants";

/** Approve/reject decision on a listing (Phase 10). Rejections need a reason the agent can act on. */
export const moderationSchema = z
  .object({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().max(500, "Reason is too long").optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.decision === "REJECT" &&
      (!value.reason || value.reason.length < 5)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Please give the agent a clear reason (at least 5 characters)",
      });
    }
  });

export type ModerationInput = z.infer<typeof moderationSchema>;

/** Account status an admin can set (ACTIVE / SUSPENDED / BANNED). */
export const userStatusSchema = z.enum(USER_STATUSES);
