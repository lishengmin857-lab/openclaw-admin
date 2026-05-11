import { NextRequest, NextResponse } from "next/server";

const NODE_BACKEND_URL = process.env.NODE_BACKEND_URL || "http://localhost:3100";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  try {
    const res = await fetch(`${NODE_BACKEND_URL}/api/v1/admin/agents`, {
      headers: { ...(token ? { authorization: token } : {}) },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "FETCH_AGENTS_FAILED" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization");
  const body = await req.json();
  try {
    const res = await fetch(`${NODE_BACKEND_URL}/api/v1/admin/agents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "CREATE_AGENT_FAILED" }, { status: 500 });
  }
}
