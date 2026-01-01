import { Heading, Hr, Section, Text } from "@react-email/components";

import { getOTPContent } from "../src/otp-content";
import { BaseLayout } from "./components/base-layout";

interface OTPVerificationEmailProps {
  otp: string;
  type: string;
}

export function OTPVerificationEmail({ otp, type }: OTPVerificationEmailProps) {
  const content = getOTPContent(type);

  return (
    <BaseLayout preview={`Your verification code is ${otp}`}>
      <Heading style={heading}>{content.title}</Heading>
      <Text style={paragraph}>{content.message}</Text>

      {/* OTP Code Box */}
      <Section style={codeContainer}>
        <Text style={codeLabel}>Your verification code</Text>
        <Text style={code}>{otp}</Text>
      </Section>

      <Hr style={hr} />

      <Text style={paragraph}>
        This code will expire in <strong>5 minutes</strong>.
      </Text>

      <Text style={warningText}>
        If you didn&apos;t request this code, you can safely ignore this email.
        Someone may have entered your email address by mistake.
      </Text>
    </BaseLayout>
  );
}

// Styles
const heading = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0 0 16px",
  padding: "0",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "26px",
  margin: "0 0 20px",
};

const codeContainer = {
  background: "#f3f4f6",
  borderRadius: "12px",
  padding: "24px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeLabel = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0 0 8px",
};

const code = {
  color: "#2563eb",
  fontSize: "36px",
  fontWeight: "bold",
  letterSpacing: "8px",
  margin: "0",
  fontFamily: "monospace",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "24px 0",
};

const warningText = {
  color: "#9ca3af",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
};

// Default export for React Email preview
export default OTPVerificationEmail;
