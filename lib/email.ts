import { Resend } from "resend";

/**
 * Transactional email via Resend (Phase 8).
 *
 * Config is read from the environment at call time: without
 * RESEND_API_KEY + EMAIL_FROM every send is a logged no-op, so the app
 * runs fully (minus emails) in unconfigured/offline environments.
 * NEVER import from client components — it holds the API key.
 */

function getConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) return null;
  return { apiKey, from };
}

export function isEmailConfigured(): boolean {
  return getConfig() !== null;
}

/** Public base URL for links inside emails. */
export function appBaseUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char]);
}

export interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/** Best-effort send — never throws; true only if Resend accepted it. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const config = getConfig();
  if (!config) {
    console.info(
      `[email] skipped (not configured): "${input.subject}" → ${input.to}`
    );
    return false;
  }
  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? `<p>${escapeHtml(input.text).replaceAll("\n", "<br/>")}</p>`,
    });
    if (error) {
      console.warn("[email] Resend rejected the message:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[email] send failed:", error);
    return false;
  }
}

/**
 * Notify the other participant about a new inquiry or a reply.
 * Fire-and-forget from the service layer (`void notifyInquiryMessage(...)`).
 */
export async function notifyInquiryMessage(params: {
  to: string;
  recipientName: string;
  isNewInquiry: boolean;
  propertyTitle: string;
  senderName: string;
  message: string;
  threadPath: string;
}): Promise<void> {
  const subject = params.isNewInquiry
    ? `New inquiry: ${params.propertyTitle}`
    : `New reply: ${params.propertyTitle}`;
  const url = `${appBaseUrl()}${params.threadPath}`;
  const intro = params.isNewInquiry
    ? `${params.senderName} sent an inquiry about "${params.propertyTitle}":`
    : `${params.senderName} replied about "${params.propertyTitle}":`;

  const text = `Hello ${params.recipientName},\n\n${intro}\n\n"${params.message}"\n\nView and reply: ${url}\n\n— RentGH`;
  const html = `
<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
  <p style="font-size:20px;font-weight:700;">Rent<span style="color:#047857;">GH</span></p>
  <p>Hello ${escapeHtml(params.recipientName)},</p>
  <p>${escapeHtml(intro)}</p>
  <blockquote style="margin:16px 0;padding:12px 16px;background:#f1f5f9;border-left:4px solid #047857;border-radius:6px;">${escapeHtml(
    params.message
  )}</blockquote>
  <p><a href="${escapeHtml(url)}" style="display:inline-block;background:#047857;color:#ffffff;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px;">View and reply</a></p>
  <p style="color:#64748b;font-size:13px;">— RentGH, Ghana Rental &amp; Property Finder</p>
</div>`;

  await sendEmail({ to: params.to, subject, text, html });
}
