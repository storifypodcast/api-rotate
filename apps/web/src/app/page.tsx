import Link from "next/link";

import { Button } from "@api_rotate/ui/button";

import { AuthShowcase } from "./_components/auth-showcase";

export default function HomePage() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-8">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          API <span className="text-primary">Rotate</span>
        </h1>
        <p className="text-muted-foreground max-w-xl text-center text-lg">
          Secure API key rotation and management system with zero-knowledge
          encryption. Your keys are encrypted client-side and never exposed to
          the server.
        </p>

        <AuthShowcase />

        <div className="flex gap-4">
          <Button asChild>
            <Link href="/admin/keys">Manage Keys</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/v1/health" target="_blank">
              API Health
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid max-w-3xl grid-cols-1 gap-4 md:grid-cols-3">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Zero-Knowledge</h3>
            <p className="text-muted-foreground text-sm">
              AES-GCM 256-bit encryption. Server never sees plaintext keys.
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Atomic Selection</h3>
            <p className="text-muted-foreground text-sm">
              PostgreSQL FOR UPDATE SKIP LOCKED prevents race conditions.
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-2 font-semibold">Smart Backoff</h3>
            <p className="text-muted-foreground text-sm">
              Exponential backoff on errors with automatic recovery.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
