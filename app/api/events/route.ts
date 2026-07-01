import { NextRequest, NextResponse } from "next/server";
import { insertEvent, getOpenEvents, closeEvent } from "@/lib/db";
import {
  SPOT_FEE,
  PERP_TAKER_FEE,
  SLIPPAGE_RTOKEN,
  SLIPPAGE_PERP,
} from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, ts, spreads, prices } = body;
    
    const maxZ = Math.max(
      Math.abs(spreads.rtoken_vs_index?.z ?? 0),
      Math.abs(spreads.rtoken_vs_mark?.z ?? 0),
      Math.abs(spreads.mark_vs_index?.z ?? 0)
    );

    if (maxZ > 100) {
      console.warn(`[events] rejected implausible z=${maxZ} for ${symbol} — likely feed error`);
      return NextResponse.json({ skipped: true, reason: "implausible z-score — data feed error" });
    }

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

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { symbol, ts, prices, resolution } = body;

    const openEvents = await getOpenEvents();
    const event = openEvents
      .filter((e) => e.symbol === symbol)
      .sort((a, b) => b.opened_at - a.opened_at)[0];

    if (!event?.id) {
      return NextResponse.json({ error: "no open event" }, { status: 404 });
    }

    const exitLong = prices.rtoken ?? event.entry_price_long;
    const exitShort = prices.perp_mark ?? event.entry_price_short;
    const grossPnl =
      (exitLong - event.entry_price_long) / event.entry_price_long -
      (exitShort - event.entry_price_short) / event.entry_price_short;
    const feeCost = SPOT_FEE * 2 + PERP_TAKER_FEE * 2;
    const slippageCost = SLIPPAGE_RTOKEN * 2 + SLIPPAGE_PERP * 2;
    const netPnl = grossPnl - feeCost - slippageCost;

    await closeEvent(event.id, {
      closed_at: ts,
      exit_price_long: exitLong,
      exit_price_short: exitShort,
      fee_cost: feeCost,
      slippage_cost: slippageCost,
      funding_cost: 0,
      gross_pnl: grossPnl,
      net_pnl: netPnl,
      resolution: resolution ?? "reverted",
    });

    return NextResponse.json({ closed: event.id, net_pnl: netPnl });
  } catch (err) {
    console.error("[PATCH /api/events]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  try {
    const openEvents = await getOpenEvents();
    let closed = 0;
    for (const event of openEvents) {
      if (!event.id) continue;
      await closeEvent(event.id, {
        closed_at: Date.now(),
        exit_price_long: event.entry_price_long,
        exit_price_short: event.entry_price_short,
        fee_cost: 0,
        slippage_cost: 0,
        funding_cost: 0,
        gross_pnl: 0,
        net_pnl: 0,
        resolution: "timeout",
      });
      closed++;
    }
    return NextResponse.json({ closed });
  } catch (err) {
    console.error("[DELETE /api/events]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
