import { NextResponse } from "next/server";
import { generateLicenses, getLicenseDashboard, syncOpenClawLicensePool } from "@/lib/licenses";

export async function GET() {
  const data = await getLicenseDashboard();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const payload = body as { count?: number; prefix?: string };
  const count = Number(payload.count);

  if (!Number.isFinite(count) || count <= 0) {
    return NextResponse.json({ error: "INVALID_COUNT" }, { status: 400 });
  }

  try {
    const created = await generateLicenses({
      count,
      prefix: payload.prefix,
    });
    const sync = await syncOpenClawLicensePool();

    return NextResponse.json({ ok: true, created, sync });
  } catch {
    return NextResponse.json({ error: "SYNC_OPENCLAW_FAILED" }, { status: 500 });
  }
}
