import { NextResponse } from "next/server";
import { errorPayload } from "@/lib/api-errors";

const upstreamBaseUrl = process.env.NODE_BACKEND_URL?.trim() || "http://127.0.0.1:3100";

export async function POST(request: Request) {
  try {
    const upstreamUrl = new URL(`${upstreamBaseUrl}/api/v1/activation-codes/use`);
    const bodyText = await request.text();

    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: bodyText,
      cache: "no-store",
    });
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(errorPayload("UPSTREAM_UNREACHABLE"), { status: 502 });
  }
}
