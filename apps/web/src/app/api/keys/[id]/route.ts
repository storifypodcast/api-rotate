import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getSession } from "~/auth/server";
import { env } from "~/env";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body: unknown = await request.json();

  const response = await fetch(`${env.BACKEND_URL}/v1/keys/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    body: JSON.stringify(body),
  });

  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const { id } = await params;

  const response = await fetch(`${env.BACKEND_URL}/v1/keys/${id}`, {
    method: "DELETE",
    headers: {
      Cookie: request.headers.get("cookie") ?? "",
    },
  });

  const data: unknown = await response.json();
  return NextResponse.json(data, { status: response.status });
}
