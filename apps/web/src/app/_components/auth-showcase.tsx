"use client";

import { useState } from "react";
import { Button } from "@api_rotate/ui/button";
import { Input } from "@api_rotate/ui/input";
import { toast } from "@api_rotate/ui/toast";

import { authClient } from "~/auth/client";

export function AuthShowcase() {
  const { data: session } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Failed to send code");
        return;
      }

      toast.success("Code sent to your email!");
      setIsOtpSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await authClient.signIn.emailOtp({
        email,
        otp,
      });

      if (result.error) {
        toast.error(result.error.message ?? "Invalid code");
        return;
      }

      toast.success("Signed in!");
      setEmail("");
      setOtp("");
      setIsOtpSent(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    toast.success("Signed out!");
  };

  if (session) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-center text-2xl">
          <span>Logged in as {session.user.name || session.user.email}</span>
        </p>
        <Button size="lg" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    );
  }

  if (!isOtpSent) {
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <form onSubmit={handleSendOtp} className="flex w-full max-w-sm flex-col gap-4">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" size="lg" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send verification code"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-sm text-muted-foreground">
        We sent a verification code to {email}
      </p>
      <form onSubmit={handleVerifyOtp} className="flex w-full max-w-sm flex-col gap-4">
        <Input
          type="text"
          placeholder="Enter code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
          maxLength={6}
        />
        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify code"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setIsOtpSent(false);
            setOtp("");
          }}
          className="text-sm text-muted-foreground hover:underline"
        >
          Use different email
        </button>
      </form>
    </div>
  );
}
