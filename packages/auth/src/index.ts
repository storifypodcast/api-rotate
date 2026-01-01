import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { expo } from "@better-auth/expo";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";

import { db } from "@api_rotate/db/client";
import { emailClient } from "@api_rotate/emails/client";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  basePath?: string;

  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
    }),
    baseURL: options.baseUrl,
    basePath: options.basePath ?? "/api/auth",
    secret: options.secret,
    emailAndPassword: {
      enabled: false,
    },
    plugins: [
      emailOTP({
        sendVerificationOTP: async ({ email, otp, type }) => {
          const result = await emailClient.sendOTPEmail({ email, otp, type });
          if (!result.success) {
            console.error(
              `[Auth] Failed to send OTP email to ${email}:`,
              result.error,
            );
          }
        },
        otpLength: 6,
        expiresIn: 300, // 5 minutes
      }),
      expo(),
      ...(options.extraPlugins ?? []),
    ],
    trustedOrigins: [],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];
