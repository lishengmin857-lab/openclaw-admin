import { NextResponse } from "next/server";

const upstreamBaseUrl = process.env.NODE_BACKEND_URL?.trim() || "http://127.0.0.1:3100";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const upstreamUrl = new URL(`${upstreamBaseUrl}/api/v1/plans`);
    upstreamUrl.search = url.searchParams.toString();

    const response = await fetch(upstreamUrl, {
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
