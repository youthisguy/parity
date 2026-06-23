import { NextResponse } from "next/server";

const POLLER_URL = process.env.POLLER_URL ?? "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${POLLER_URL}/status`, {
      next: { revalidate: 0 },  
    });
    const data = await res.json();
    return NextResponse.json({ connected: true, ...data });
  } catch {
    return NextResponse.json({ connected: false });
  }
}