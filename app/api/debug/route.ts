import { NextResponse } from "next/server";
import { getOpenEvents } from "@/lib/db";

export async function GET() {
  const events = await getOpenEvents();
  return NextResponse.json({ 
    count: events.length,
    sample: events.slice(0, 3),
  });
}