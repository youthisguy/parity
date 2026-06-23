import { NextRequest, NextResponse } from "next/server";
import { insertTick, getRecentTicks } from "@/lib/db";
import type { Tick } from "@/types";

// POST — poller writes ticks here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ticks: Omit<Tick, "id">[] = Array.isArray(body) ? body : [body];

    const ids: number[] = [];
    for (const tick of ticks) {
      if (!tick.symbol || !tick.ts) {
        return NextResponse.json({ error: "symbol and ts required" }, { status: 400 });
      }
      ids.push(
        insertTick({
          symbol: tick.symbol,
          asset_class: tick.asset_class ?? "stock",
          ts: tick.ts,
          rtoken_price: tick.rtoken_price ?? null,
          perp_mark: tick.perp_mark ?? null,
          perp_index: tick.perp_index ?? null,
          funding_rate: tick.funding_rate ?? null,
        })
      );
    }

    return NextResponse.json({ inserted: ids.length, ids });
  } catch (err) {
    console.error("[POST /api/ticks]", err);
    return NextResponse.json({ error: "internal error" }, { status: 500 });
  }
}

// GET — dashboard queries recent ticks for a symbol
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const symbol = searchParams.get("symbol");
  const limit = parseInt(searchParams.get("limit") ?? "120", 10);

  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  const ticks = getRecentTicks(symbol, limit);
  return NextResponse.json({ ticks: ticks.reverse() });  
}