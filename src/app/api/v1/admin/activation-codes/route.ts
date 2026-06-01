import { NextResponse } from "next/server";
import { errorPayload } from "@/lib/api-errors";

const upstreamBaseUrl = process.env.NODE_BACKEND_URL?.trim() || "http://127.0.0.1:3100";

export async function GET(request: Request) {
  try {
    const upstreamUrl = new URL(`${upstreamBaseUrl}/api/v1/admin/activation-codes`);

    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
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
