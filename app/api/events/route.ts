import { NextRequest, NextResponse } from "next/server";
import { insertEvent } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, ts, spreads, prices } = body;

    if (!symbol || !ts || !spreads || !prices) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const id = await insertEvent({
      symbol,
      asset_class: "stock",
      opened_at: ts,
      closed_at: null,
      rtoken_vs_index: spreads.rtoken_vs_index?.spread ?? null,
      mark_vs_index: spreads.mark_vs_index?.spread ?? 0,
      rtoken_vs_mark: spreads.rtoken_vs_mark?.spread ?? null,
      ontoken_vs_rtoken: spreads.ontoken_vs_rtoken?.spread ?? null,
      ontoken_vs_mark: spreads.ontoken_vs_mark?.spread ?? null,
      z_rtoken_vs_index: spreads.rtoken_vs_index?.z ?? null,
      z_mark_vs_index: spreads.mark_vs_index?.z ?? 0,
      z_rtoken_vs_mark: spreads.rtoken_vs_mark?.z ?? null,
      z_ontoken_vs_rtoken: spreads.ontoken_vs_rtoken?.z ?? null,
      z_ontoken_vs_mark: spreads.ontoken_vs_mark?.z ?? null,
      simulated_leg_long: "rtoken",
      simulated_leg_short: "mark",
      entry_price_long: prices.rtoken ?? 0,
      entry_price_short: prices.perp_mark ?? 0,
      exit_price_long: null,
      exit_price_short: null,
      fee_cost: null,
      slippage_cost: null,
      funding_cost: null,
      gross_pnl: null,
      net_pnl: null,
      resolution: "open",
      notes: null,
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("[POST /api/events]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}