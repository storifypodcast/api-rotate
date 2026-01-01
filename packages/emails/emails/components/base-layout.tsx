import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface BaseLayoutProps {
  preview: string;
  children: ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Logo */}
          <Section style={header}>
            <Text style={logoText}>API Rotate</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              API Rotate - Secure API Key Management
            </Text>
            <Text style={footerSubtext}>
              Rotating your API keys, keeping your services running.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "580px",
};

const header = {
  padding: "32px 48px 24px",
  borderBottom: "1px solid #e6ebf1",
};

const logoText = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#2563eb",
  margin: "0",
  textAlign: "center" as const,
};

const content = {
  padding: "32px 48px",
};

const footer = {
  padding: "24px 48px",
  borderTop: "1px solid #e6ebf1",
  textAlign: "center" as const,
};

const footerText = {
  color: "#8898aa",
  fontSize: "14px",
  margin: "0 0 4px",
};

const footerSubtext = {
  color: "#8898aa",
  fontSize: "12px",
  margin: "0",
};
