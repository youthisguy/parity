import { NextRequest, NextResponse } from "next/server";
import { getRecentEvents, getOpenEvents } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter"); // 'open' | undefined
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const events = filter === "open" ? getOpenEvents() : getRecentEvents(limit);
  return NextResponse.json({ events });
}