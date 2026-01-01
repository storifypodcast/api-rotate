import { OTPVerificationEmail } from "../emails/otp-verification";
import { getOTPContent } from "./otp-content";
import { sendEmail } from "./send";

export interface SendOTPEmailParams {
  email: string;
  otp: string;
  type: string;
}

/**
 * Email client for sending typed emails
 */
export class EmailClient {
  /**
   * Send OTP verification email
   */
  async sendOTPEmail({ email, otp, type }: SendOTPEmailParams) {
    const content = getOTPContent(type);

    return sendEmail({
      to: email,
      subject: content.subject,
      react: OTPVerificationEmail({ otp, type }),
    });
  }
}

// Export singleton instance
export const emailClient = new EmailClient();
