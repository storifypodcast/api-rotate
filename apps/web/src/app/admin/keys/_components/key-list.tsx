"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@api_rotate/ui/badge";
import { Button } from "@api_rotate/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@api_rotate/ui/table";
import { toast } from "@api_rotate/ui/toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@api_rotate/ui/tooltip";

import { useEncryption } from "./encryption-provider";
import { KeyForm } from "./key-form";
import type { ApiKeyData, ApiResponse } from "./types";

function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString();
}

function isAvailable(availableAt: string): boolean {
  return new Date(availableAt) <= new Date();
}

export function KeyList() {
  const { currentFingerprint } = useEncryption();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const response = await fetch("/api/keys", {
        credentials: "include",
      });

      const data = (await response.json()) as ApiResponse<ApiKeyData[]>;

      if (!data.success || !data.data) {
        setError(data.error?.message ?? "Failed to fetch keys");
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

  const handleToggleActive = async (key: ApiKeyData) => {
    try {
      const response = await fetch(`/api/keys/${key.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive: !key.isActive }),
      });

      const data = (await response.json()) as ApiResponse<unknown>;

      if (!data.success) {
        toast.error(data.error?.message ?? "Failed to update key");
        return;
      }

      toast.success(
        key.isActive ? "Key paused successfully" : "Key activated successfully",
      );
      void fetchKeys();
    } catch {
      toast.error("Failed to update key");
    }
  };

  const handleDelete = async (key: ApiKeyData) => {
    if (!confirm(`Are you sure you want to delete "${key.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${key.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = (await response.json()) as ApiResponse<unknown>;

      if (!data.success) {
        toast.error(data.error?.message ?? "Failed to delete key");
        return;
      }

      toast.success("Key deleted successfully");
      void fetchKeys();
    } catch {
      toast.error("Failed to delete key");
    }
  };

  // Check if a key's fingerprint matches the current encryption key
  const isFingerprintMismatch = (key: ApiKeyData): boolean => {
    if (!currentFingerprint) return false;
    if (!key.keyFingerprint) return false; // Legacy key - can't determine
    return key.keyFingerprint !== currentFingerprint;
  };

  const isLegacyKey = (key: ApiKeyData): boolean => {
    return key.keyFingerprint === null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="text-muted-foreground">Loading keys...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded border border-destructive p-4">
        <p className="text-destructive">{error}</p>
        <Button variant="outline" className="mt-2" onClick={() => void fetchKeys()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <KeyForm onKeyCreated={() => void fetchKeys()} />
        </div>

        {keys.length === 0 ? (
          <div className="rounded border p-8 text-center">
            <p className="text-muted-foreground">
              No API keys yet. Click &ldquo;Add API Key&rdquo; to create one.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cooldown</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Errors</TableHead>
                <TableHead>Available At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {keys.map((key) => (
                <TableRow key={key.id} className={isFingerprintMismatch(key) ? "bg-yellow-50 dark:bg-yellow-950/20" : ""}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {key.name}
                      {isFingerprintMismatch(key) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-yellow-600" title="Key fingerprint mismatch">
                              ⚠️
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This key was encrypted with a different encryption key.</p>
                            <p className="text-xs text-muted-foreground">
                              Key fingerprint: {key.keyFingerprint?.slice(0, 8)}...
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {isLegacyKey(key) && (
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline" className="text-xs">Legacy</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>This key was created before fingerprint tracking.</p>
                            <p className="text-xs text-muted-foreground">
                              Re-create the key to enable fingerprint validation.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {key.type ? (
                      <Badge variant="outline">{key.type}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {key.isActive ? (
                      isAvailable(key.availableAt) ? (
                        <Badge className="bg-green-500">Available</Badge>
                      ) : (
                        <Badge variant="secondary">Cooldown</Badge>
                      )
                    ) : (
                      <Badge variant="destructive">Paused</Badge>
                    )}
                  </TableCell>
                  <TableCell>{key.defaultCooldown}s</TableCell>
                  <TableCell>{key.useCount.toLocaleString()}</TableCell>
                  <TableCell>
                    {key.errorCount > 0 ? (
                      <span className="text-destructive">
                        {key.errorCount.toLocaleString()}
                        {key.consecutiveErrors > 0 && (
                          <span className="text-xs">
                            {" "}
                            ({key.consecutiveErrors} consecutive)
                          </span>
                        )}
                      </span>
                    ) : (
                      "0"
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDate(key.availableAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleToggleActive(key)}
                      >
                        {key.isActive ? "Pause" : "Resume"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleDelete(key)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </TooltipProvider>
  );
}
