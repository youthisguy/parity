import { NextResponse } from "next/server";
import { getOpenEvents } from "@/lib/db";

/**
 * MCP tool: get_active_divergences
 * GET /api/mcp/active_divergences
 *
 * Returns all currently open simulated divergence events.
 */
export async function GET() {
  const events = getOpenEvents();
  return NextResponse.json({
    tool: "get_active_divergences",
    count: events.length,
    events: events.map((e) => ({
      id: e.id,
      symbol: e.symbol,
      asset_class: e.asset_class,
      opened_at: e.opened_at,
      z_mark_vs_index: e.z_mark_vs_index,
      z_rtoken_vs_index: e.z_rtoken_vs_index,
      z_rtoken_vs_mark: e.z_rtoken_vs_mark,
      simulated_legs: `long ${e.simulated_leg_long} / short ${e.simulated_leg_short}`,
    })),
  });
}