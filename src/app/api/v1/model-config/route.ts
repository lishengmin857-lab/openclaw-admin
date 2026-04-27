const NODE_BACKEND_URL = process.env.NODE_BACKEND_URL || "http://127.0.0.1:3100";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  const response = await fetch(`${NODE_BACKEND_URL}/api/v1/model-config`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get("authorization");
  const body = await request.json();
  
  const response = await fetch(`${NODE_BACKEND_URL}/api/v1/model-config`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return Response.json(data, { status: response.status });
}