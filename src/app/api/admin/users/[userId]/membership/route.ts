import { NextRequest, NextResponse } from "next/server";

const upstreamBaseUrl = process.env.NODE_BACKEND_URL?.trim() || "http://127.0.0.1:3100";

export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const body = await request.text();
    const response = await fetch(`${upstreamBaseUrl}/api/v1/admin/users/${userId}/membership`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("authorization") || "",
      },
      body,
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "UPSTREAM_UNREACHABLE" }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  try {
    const response = await fetch(`${upstreamBaseUrl}/api/v1/admin/users/${userId}/membership`, {
      method: "DELETE",
      headers: { Authorization: request.headers.get("authorization") || "" },
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "UPSTREAM_UNREACHABLE" }, { status: 502 });
  }
}
