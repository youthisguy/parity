import { NextRequest, NextResponse } from "next/server";
import { getRecentTicks } from "@/lib/db";
import { checkDivergence, computeSpreads } from "@/lib/engine";
import { ROLLING_WINDOW } from "@/lib/constants";

/**
 * MCP tool: check_divergence
 * GET /api/mcp/check_divergence?symbol=TSLAUSDT
 *
 * Returns the current divergence state for a symbol.
 * Agent-callable: no auth, structured JSON, self-describing.
 */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json(
      {
        tool: "check_divergence",
        error: "symbol param required. Example: ?symbol=TSLAUSDT",
      },
      { status: 400 }
    );
  }

  const ticks = getRecentTicks(symbol, ROLLING_WINDOW + 1);
  if (ticks.length === 0) {
    return NextResponse.json({
      tool: "check_divergence",
      symbol,
      status: "no_data",
      message: "No ticks found for this symbol. Is the poller running?",
    });
  }

  // Build rolling spread history
  const history = { rtokenVsIndex: [] as number[], markVsIndex: [] as number[], rtokenVsMark: [] as number[] };
  const sorted = [...ticks].reverse(); // oldest first
  for (const t of sorted.slice(0, -1)) {
    const s = computeSpreads(t);
    if (s.rtokenVsIndex != null) history.rtokenVsIndex.push(s.rtokenVsIndex);
    if (s.markVsIndex != null) history.markVsIndex.push(s.markVsIndex);
    if (s.rtokenVsMark != null) history.rtokenVsMark.push(s.rtokenVsMark);
  }

  const latest = sorted[sorted.length - 1];
  const result = checkDivergence(latest, history);

  return NextResponse.json({
    tool: "check_divergence",
    symbol,
    ts: result.ts,
    flagged: result.flagged,
    spreads: {
      rtoken_vs_index: result.rtoken_vs_index,
      mark_vs_index: result.mark_vs_index,
      rtoken_vs_mark: result.rtoken_vs_mark,
    },
    prices: {
      rtoken: latest.rtoken_price,
      perp_mark: latest.perp_mark,
      perp_index: latest.perp_index,
    },
  });
}