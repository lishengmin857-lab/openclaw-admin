import { NextRequest, NextResponse } from "next/server";

const upstreamBaseUrl = process.env.NODE_BACKEND_URL?.trim() || "http://127.0.0.1:3100";

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${upstreamBaseUrl}/api/v1/admin/auth/me`, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("authorization") || "",
      },
      cache: "no-store",
    });

    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "UPSTREAM_UNREACHABLE" }, { status: 502 });
  }
}
