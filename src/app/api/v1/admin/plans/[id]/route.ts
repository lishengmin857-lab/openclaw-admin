import { NextRequest, NextResponse } from "next/server";

const NODE_BACKEND_URL = process.env.NODE_BACKEND_URL || "http://localhost:3100";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get("authorization");
  const body = await req.json();
  console.log(`[proxy] Updating plan with ID: "${id}"`);

  try {
    const res = await fetch(`${NODE_BACKEND_URL}/api/v1/admin/plans/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: "UPDATE_PLAN_FAILED" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = req.headers.get("authorization");

  try {
    const res = await fetch(`${NODE_BACKEND_URL}/api/v1/admin/plans/${id}`, {
      method: "DELETE",
      headers: {
        ...(token ? { authorization: token } : {}),
      },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "DELETE_PLAN_FAILED" }, { status: 500 });
  }
}
