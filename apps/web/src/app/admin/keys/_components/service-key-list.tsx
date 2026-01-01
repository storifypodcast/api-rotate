"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@api_rotate/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@api_rotate/ui/table";
import { toast } from "@api_rotate/ui/toast";

interface ServiceKeyData {
  id: string;
  userId: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  expiresAt: string | null;
}

interface GeneratedKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  return new Date(dateString).toLocaleString();
}

function ServiceKeyForm({ onKeyCreated }: { onKeyCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<GeneratedKey | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/service-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
      });

      const data = (await response.json()) as ApiResponse<GeneratedKey>;

      if (!data.success || !data.data) {
        toast.error(data.error?.message ?? "Failed to create service key");
        return;
      }

      setGeneratedKey(data.data);
      toast.success("Service key created successfully");
      onKeyCreated();
    } catch {
      toast.error("Failed to create service key");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async () => {
    if (!generatedKey) return;
    await navigator.clipboard.writeText(generatedKey.key);
    setCopied(true);
    toast.success("Key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setName("");
    setGeneratedKey(null);
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Service Key</Button>
      </DialogTrigger>
      <DialogContent>
        {!generatedKey ? (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generate Service Key</DialogTitle>
              <DialogDescription>
                Create a new service key for programmatic API access. This key
                will be used to authenticate your applications.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Key Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., production-server"
                  required
                  minLength={1}
                  maxLength={100}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? "Generating..." : "Generate"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Service Key Generated</DialogTitle>
              <DialogDescription>
                <span className="font-semibold text-destructive">
                  Copy this key now! It will not be shown again.
                </span>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Your Service Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedKey.key}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this key as a Bearer token in the Authorization header.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ServiceKeyList() {
  const [keys, setKeys] = useState<ServiceKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/service-keys", {
        credentials: "include",
      });

      const data = (await response.json()) as ApiResponse<ServiceKeyData[]>;

      if (!data.success || !data.data) {
        setError(data.error?.message ?? "Failed to fetch service keys");
        return;
      }

      setKeys(data.data);
      setError(null);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchKeys();
  }, [fetchKeys]);

  const handleRevoke = async (key: ServiceKeyData) => {
    if (
      !confirm(
        `Are you sure you want to revoke "${key.name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/service-keys/${key.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await response.json()) as ApiResponse<unknown>;

      if (!data.success) {
        toast.error(data.error?.message ?? "Failed to revoke key");
        return;
      }

      toast.success("Service key revoked successfully");
      void fetchKeys();
    } catch {
      toast.error("Failed to revoke key");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Loading service keys...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-destructive p-4">
        <p className="text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-2"
          onClick={() => void fetchKeys()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Service Keys</h2>
          <p className="text-sm text-muted-foreground">
            Use service keys to authenticate your applications with the API.
          </p>
        </div>
        <ServiceKeyForm onKeyCreated={() => void fetchKeys()} />
      </div>

      {keys.length === 0 ? (
        <div className="rounded border p-8 text-center">
          <p className="text-muted-foreground">
            No service keys yet. Generate one to start using the API
            programmatically.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key Prefix</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {key.keyPrefix}...
                </TableCell>
                <TableCell>
                  {key.isActive ? (
                    <Badge className="bg-green-500">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(key.lastUsedAt)}
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(key.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => void handleRevoke(key)}
                  >
                    Revoke
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
