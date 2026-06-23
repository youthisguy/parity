import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

export async function GET() {
  const rows = getLeaderboard();
  return NextResponse.json({ leaderboard: rows });
}