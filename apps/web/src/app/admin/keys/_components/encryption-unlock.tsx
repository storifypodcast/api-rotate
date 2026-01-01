"use client";

import { useState } from "react";

import { Button } from "@api_rotate/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@api_rotate/ui/card";
import { Input } from "@api_rotate/ui/input";
import { Label } from "@api_rotate/ui/label";
import { toast } from "@api_rotate/ui/toast";

import { useEncryption } from "./encryption-provider";

export function EncryptionUnlock() {
  const { setEncryptionKey } = useEncryption();
  const [key, setKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!key.trim()) {
        toast.error("Please enter an encryption key");
        return;
      }

      // Validate base64 format and decoded length (32 bytes for AES-256)
      try {
        const decoded = atob(key.trim());
        if (decoded.length !== 32) {
          toast.error("Invalid key: must be exactly 32 bytes when decoded");
          return;
        }
      } catch {
        toast.error("Invalid key: must be valid base64");
        return;
      }

      setEncryptionKey(key.trim());
      toast.success("Encryption key set successfully");
      setKey("");
    } catch {
      toast.error("Failed to set encryption key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Unlock Key Vault</CardTitle>
        <CardDescription>
          Enter your encryption key to manage API keys. The key is stored only
          in browser memory and never sent to the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="encryption-key">Encryption Key</Label>
            <Input
              id="encryption-key"
              type="password"
              placeholder="Enter your AES-256 encryption key (base64)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Unlocking..." : "Unlock Vault"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
