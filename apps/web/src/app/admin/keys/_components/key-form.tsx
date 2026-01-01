"use client";

import { useState } from "react";

import { Button } from "@api_rotate/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@api_rotate/ui/dialog";
import { Input } from "@api_rotate/ui/input";
import { Label } from "@api_rotate/ui/label";
import { toast } from "@api_rotate/ui/toast";

import { useEncryption } from "./encryption-provider";
import type { ApiResponse } from "./types";

interface KeyFormProps {
  onKeyCreated: () => void;
}

export function KeyForm({ onKeyCreated }: KeyFormProps) {
  const { encryptValue, currentFingerprint } = useEncryption();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [type, setType] = useState("");
  const [defaultCooldown, setDefaultCooldown] = useState("30");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!name.trim() || !apiKey.trim()) {
        toast.error("Name and API key are required");
        return;
      }

      const encryptedKey = await encryptValue(apiKey.trim());

      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          encryptedKey,
          type: type.trim() || null,
          defaultCooldown: parseInt(defaultCooldown, 10) || 30,
          keyFingerprint: currentFingerprint,
        }),
      });

      const data = (await response.json()) as ApiResponse<unknown>;

      if (!data.success) {
        toast.error(data.error?.message ?? "Failed to create key");
        return;
      }

      toast.success("API key created successfully");
      setOpen(false);
      resetForm();
      onKeyCreated();
    } catch {
      toast.error("Failed to create key");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setApiKey("");
    setType("");
    setDefaultCooldown("30");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add API Key</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New API Key</DialogTitle>
          <DialogDescription>
            The API key will be encrypted client-side before being sent to the
            server. The server never sees the plaintext key.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="my-openai-key-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key (plaintext)</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type (optional)</Label>
            <Input
              id="type"
              placeholder="openai, gemini, anthropic..."
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cooldown">Default Cooldown (seconds)</Label>
            <Input
              id="cooldown"
              type="number"
              min="1"
              max="14400"
              value={defaultCooldown}
              onChange={(e) => setDefaultCooldown(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
