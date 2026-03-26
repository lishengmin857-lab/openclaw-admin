import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "pong" });
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }
  return NextResponse.json({ echo: body });
}
