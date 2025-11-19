import { NextRequest, NextResponse } from "next/server";
import { getAvailability } from "@/lib/scheduler";

export const runtime = "nodejs";

function checkAuth(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 });
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return new NextResponse("Missing date", { status: 400 });
  const data = getAvailability(date);
  return NextResponse.json(data);
}
