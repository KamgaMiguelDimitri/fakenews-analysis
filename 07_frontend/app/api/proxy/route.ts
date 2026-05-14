import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function GET(request: NextRequest) {
  const { pathname, search } = new URL(request.url);
  const target = `${API_BASE}${pathname.replace("/api/proxy", "")}${search}`;
  const res = await fetch(target, { headers: request.headers });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const target = `${API_BASE}${pathname.replace("/api/proxy", "")}`;
  const body = await request.text();
  const res = await fetch(target, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
