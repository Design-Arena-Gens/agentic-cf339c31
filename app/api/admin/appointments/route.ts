import { NextRequest, NextResponse } from "next/server";
import { Store } from "@/lib/store";

export const runtime = "nodejs";

function checkAuth(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  return !!process.env.ADMIN_TOKEN && token === process.env.ADMIN_TOKEN;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 });
  const data = Store.listAppointments();
  return NextResponse.json({ items: data });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) return new NextResponse("Unauthorized", { status: 401 });
  // simplistic: wipe all
  Store.clearAll();
  return NextResponse.json({ ok: true });
}
