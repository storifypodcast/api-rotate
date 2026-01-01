"use client";

import { useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@api_rotate/ui/card";

import type { ApiKeyStats, ApiResponse } from "./types";

export function KeyStats() {
  const [stats, setStats] = useState<ApiKeyStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/keys/stats", {
          credentials: "include",
        });

        const data = (await response.json()) as ApiResponse<ApiKeyStats>;

        if (!data.success || !data.data) {
          setError(data.error?.message ?? "Failed to fetch stats");
          return;
        }

        setStats(data.data);
      } catch {
        setError("Failed to connect to server");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
    const interval = setInterval(() => void fetchStats(), 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription className="h-4 w-20 animate-pulse rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <p className="text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Keys", value: stats.totalKeys },
    { label: "Active Keys", value: stats.activeKeys },
    { label: "Available Now", value: stats.availableNow },
    { label: "Total Uses", value: stats.totalUses.toLocaleString() },
    { label: "Total Errors", value: stats.totalErrors.toLocaleString() },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-5">
      {statCards.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="pb-2">
            <CardDescription>{stat.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <CardTitle className="text-2xl">{stat.value}</CardTitle>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
