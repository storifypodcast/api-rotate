"use client";

import Link from "next/link";

import { Button } from "@api_rotate/ui/button";

import { authClient } from "~/auth/client";

import {
  EncryptionProvider,
  EncryptionUnlock,
  KeyList,
  KeyStats,
  ServiceKeyList,
  useEncryption,
} from "./_components";

function KeysContent() {
  const { isUnlocked, clearEncryptionKey } = useEncryption();

  if (!isUnlocked) {
    return (
      <div className="py-8">
        <EncryptionUnlock />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="ghost" size="sm" onClick={clearEncryptionKey}>
          Lock Vault
        </Button>
      </div>
      <KeyStats />
      <KeyList />
    </div>
  );
}

export default function AdminKeysPage() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <main className="container py-8">
        <div className="text-center text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="container py-8">
        <div className="mx-auto max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">Authentication Required</h1>
          <p className="mb-4 text-muted-foreground">
            Please sign in to access the admin panel.
          </p>
          <Button asChild>
            <Link href="/">Go to Sign In</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">API Key Management</h1>
        <p className="text-muted-foreground">
          Manage your encrypted API keys with zero-knowledge security.
        </p>
      </div>

      {/* Service Keys section - no encryption needed */}
      <div className="mb-8">
        <ServiceKeyList />
      </div>

      <hr className="my-8" />

      <EncryptionProvider>
        <KeysContent />
      </EncryptionProvider>
    </main>
  );
}
