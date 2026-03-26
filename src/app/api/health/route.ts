import { NextResponse } from "next/server";

/** 负载均衡 / 探活 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "backend",
    timestamp: new Date().toISOString(),
  });
}
