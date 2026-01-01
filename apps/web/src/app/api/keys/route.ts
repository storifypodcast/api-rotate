import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSession } from "~/auth/server";
import { env } from "~/env";

export async function GET(_request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const response = await fetch(`${env.BACKEND_URL}/v1/keys`, {
    headers: {
      Cookie: _request.headers.get("cookie") ?? "",
    },
  });

  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body: unknown = await request.json();

  const response = await fetch(`${env.BACKEND_URL}/v1/keys`, {
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
