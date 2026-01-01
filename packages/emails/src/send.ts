import type { ReactElement } from "react";
import { Resend } from "resend";

import { emailEnv } from "./env";

const env = emailEnv();

const DEFAULT_FROM = "noreply@apirotate.com";

// Create Resend instance (null if no API key)
export const resend = env.RESEND_API_KEY
  ? new Resend(env.RESEND_API_KEY)
  : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend
 * In development without API key, logs to console instead
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  const {
    to,
    subject,
    react,
    from = env.EMAIL_FROM ?? DEFAULT_FROM,
  } = options;

  // In development without API key, just log
  if (!resend) {
    console.log("[Email] No RESEND_API_KEY configured - email not sent:");
    console.log(`  To: ${Array.isArray(to) ? to.join(", ") : to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  From: ${from}`);
    return { success: true, id: "dev-mode" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      react,
    });

    if (error) {
      console.error("[Email] Failed to send:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error("[Email] Error sending email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
