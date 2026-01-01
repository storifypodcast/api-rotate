export type OTPType =
  | "sign-in"
  | "sign-up"
  | "forget-password"
  | "email-verification";

export interface OTPContent {
  subject: string;
  title: string;
  message: string;
}

export const OTP_CONTENT: Record<OTPType, OTPContent> = {
  "sign-in": {
    subject: "Your API Rotate Sign In Code",
    title: "Sign in to API Rotate",
    message:
      "Enter this code to sign in to your API Rotate account and manage your API keys.",
  },
  "sign-up": {
    subject: "Welcome to API Rotate - Verify Your Email",
    title: "Welcome to API Rotate!",
    message:
      "Thank you for joining API Rotate! Enter this code to verify your email and start managing your API keys.",
  },
  "forget-password": {
    subject: "Reset Your API Rotate Password",
    title: "Reset Your Password",
    message:
      "We received a request to reset your API Rotate password. Enter this code to continue with the reset process.",
  },
  "email-verification": {
    subject: "Verify Your API Rotate Email",
    title: "Verify Your Email",
    message:
      "Please verify your email address to ensure you receive important updates about your API keys.",
  },
};

export const DEFAULT_OTP_CONTENT: OTPContent = {
  subject: "Your API Rotate Verification Code",
  title: "Your Verification Code",
  message: "Use this code to verify your identity on API Rotate.",
};

function isOTPType(type: string): type is OTPType {
  return type in OTP_CONTENT;
}

export function getOTPContent(type: string): OTPContent {
  if (isOTPType(type)) {
    return OTP_CONTENT[type];
  }
  return DEFAULT_OTP_CONTENT;
}
