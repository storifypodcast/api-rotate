import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSession } from "~/auth/server";
import { env } from "~/env";

// GET /api/encryption-key - Get encryption key info
export async function GET(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const response = await fetch(`${env.BACKEND_URL}/v1/encryption-key/info`, {
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
  });

  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}

// POST /api/encryption-key - Setup encryption key
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();

  const response = await fetch(`${env.BACKEND_URL}/v1/encryption-key/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}
