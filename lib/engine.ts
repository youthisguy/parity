import type { Tick, DivergenceEvent, SpreadStats, DivergenceCheck } from "@/types";
import {
  Z_THRESHOLD,
  ROLLING_WINDOW,
  EVENT_TIMEOUT_TICKS,
  REVERSION_Z,
  IMPLAUSIBLE_JUMP_PCT,
  SPOT_FEE,
  PERP_TAKER_FEE,
  SLIPPAGE_RTOKEN,
  SLIPPAGE_PERP,
  FUNDING_HOLD_THRESHOLD_MS,
} from "./constants";

// ── Rolling z-score  

export function computeSpreadStats(
  spreads: number[],
  currentSpread: number
): SpreadStats {
  const window = spreads.slice(-ROLLING_WINDOW);
  if (window.length < 2) {
    return { mean: currentSpread, stdev: 0, z: 0, spread: currentSpread };
  }
  const mean = window.reduce((a, b) => a + b, 0) / window.length;
  const variance =
    window.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (window.length - 1);
  const stdev = Math.sqrt(variance);
  const z = stdev === 0 ? 0 : (currentSpread - mean) / stdev;
  return { mean, stdev, z, spread: currentSpread };
}

// ── False-signal filter  

export function isImplausibleTick(prev: Tick | null, curr: Tick): boolean {
  if (
    (curr.rtoken_price !== null && curr.rtoken_price <= 0) ||
    (curr.ontoken_price !== null && curr.ontoken_price <= 0) ||
    (curr.perp_mark !== null && curr.perp_mark <= 0) ||
    (curr.perp_index !== null && curr.perp_index <= 0)
  ) {
    return true;
  }
  if (!prev) return false;
  const check = (a: number | null, b: number | null) => {
    if (a == null || b == null || a === 0) return false;
    return Math.abs((b - a) / a) > IMPLAUSIBLE_JUMP_PCT;
  };
  return (
    check(prev.rtoken_price, curr.rtoken_price) ||
    check(prev.perp_mark, curr.perp_mark) ||
    check(prev.perp_index, curr.perp_index)
  );
}

// ── Spread computation  

export function computeSpreads(tick: Tick): {
  rtokenVsIndex: number | null;
  markVsIndex: number | null;
  rtokenVsMark: number | null;
  ontokenVsRtoken: number | null;
  ontokenVsMark: number | null;
} {
  const { rtoken_price, ontoken_price, perp_mark, perp_index } = tick;
  return {
    rtokenVsIndex:
      rtoken_price != null && rtoken_price > 0 &&
      perp_index != null && perp_index > 0
        ? (rtoken_price - perp_index) / perp_index : null,
    markVsIndex:
      perp_mark != null && perp_mark > 0 &&
      perp_index != null && perp_index > 0
        ? (perp_mark - perp_index) / perp_index : null,
    rtokenVsMark:
      rtoken_price != null && rtoken_price > 0 &&
      perp_mark != null && perp_mark > 0
        ? (rtoken_price - perp_mark) / perp_mark : null,
    ontokenVsRtoken:
      ontoken_price != null && ontoken_price > 0 &&
      rtoken_price != null && rtoken_price > 0
        ? (ontoken_price - rtoken_price) / rtoken_price : null,
    ontokenVsMark:
      ontoken_price != null && ontoken_price > 0 &&
      perp_mark != null && perp_mark > 0
        ? (ontoken_price - perp_mark) / perp_mark : null,
  };
}

// ── Full divergence check on a new tick ──────────────────────────────────
// Pass in the rolling spread history (last ROLLING_WINDOW values per spread type)
export function checkDivergence(
    tick: Tick,
    history: {
      rtokenVsIndex: number[];
      markVsIndex: number[];
      rtokenVsMark: number[];
      ontokenVsRtoken: number[];
      ontokenVsMark: number[];
    }
  ): DivergenceCheck {
    const spreads = computeSpreads(tick);
  
    const rtokenVsIndexStats = spreads.rtokenVsIndex != null
      ? computeSpreadStats(history.rtokenVsIndex, spreads.rtokenVsIndex) : null;
  
    const markVsIndexStats = spreads.markVsIndex != null
      ? computeSpreadStats(history.markVsIndex, spreads.markVsIndex)
      : { mean: 0, stdev: 0, z: 0, spread: 0 };
  
    const rtokenVsMarkStats = spreads.rtokenVsMark != null
      ? computeSpreadStats(history.rtokenVsMark, spreads.rtokenVsMark) : null;
  
    const ontokenVsRtokenStats = spreads.ontokenVsRtoken != null
      ? computeSpreadStats(history.ontokenVsRtoken, spreads.ontokenVsRtoken) : null;
  
    const ontokenVsMarkStats = spreads.ontokenVsMark != null
      ? computeSpreadStats(history.ontokenVsMark, spreads.ontokenVsMark) : null;
  
    const flagged =
      Math.abs(markVsIndexStats.z) > Z_THRESHOLD ||
      (rtokenVsIndexStats != null && Math.abs(rtokenVsIndexStats.z) > Z_THRESHOLD) ||
      (rtokenVsMarkStats != null && Math.abs(rtokenVsMarkStats.z) > Z_THRESHOLD) ||
      (ontokenVsRtokenStats != null && Math.abs(ontokenVsRtokenStats.z) > Z_THRESHOLD) ||
      (ontokenVsMarkStats != null && Math.abs(ontokenVsMarkStats.z) > Z_THRESHOLD);
  
    return {
      symbol: tick.symbol,
      ts: tick.ts,
      rtoken_vs_index: rtokenVsIndexStats,
      mark_vs_index: markVsIndexStats,
      rtoken_vs_mark: rtokenVsMarkStats,
      ontoken_vs_rtoken: ontokenVsRtokenStats,
      ontoken_vs_mark: ontokenVsMarkStats,
      flagged,
      active_event_id: null,
    };
}
  

// ── Event open  
export function buildOpenEvent(
    tick: Tick,
    check: DivergenceCheck
  ): Omit<DivergenceEvent, "id"> {
    // Pick the most dislocated spread to trade
    const stats = [
      { key: "rtoken_vs_index" as const, stats: check.rtoken_vs_index, long: "rtoken" as const, short: "index_proxy" as const },
      { key: "mark_vs_index" as const,   stats: check.mark_vs_index,   long: "mark" as const,   short: "index_proxy" as const },
      { key: "rtoken_vs_mark" as const,  stats: check.rtoken_vs_mark,  long: "rtoken" as const, short: "mark" as const },
  
      { key: "ontoken_vs_rtoken" as const, stats: check.ontoken_vs_rtoken, long: "ontoken" as const, short: "rtoken" as const },
      { key: "ontoken_vs_mark" as const,   stats: check.ontoken_vs_mark,   long: "ontoken" as const, short: "mark" as const },
    ]
      .filter((s) => s.stats != null)
      .sort((a, b) => Math.abs(b.stats!.z) - Math.abs(a.stats!.z));
  
    const best = stats[0];
    const isPositive = best.stats!.spread > 0;
  
    // If spread > 0, long leg is expensive → short it, and vice versa
    const legLong = isPositive ? best.short : best.long;
    const legShort = isPositive ? best.long : best.short;
  
    const entryLong =
      legLong === "rtoken" ? tick.rtoken_price! :
      legLong === "ontoken" ? tick.ontoken_price! :
      legLong === "mark" ? tick.perp_mark! :
      tick.perp_index!;
  
    const entryShort =
      legShort === "rtoken" ? tick.rtoken_price! :
      legShort === "ontoken" ? tick.ontoken_price! :
      legShort === "mark" ? tick.perp_mark! :
      tick.perp_index!;
  
    return {
      symbol: tick.symbol,
      asset_class: tick.asset_class,
      opened_at: tick.ts,
      closed_at: null,
  
      // spreads at open
      rtoken_vs_index: check.rtoken_vs_index?.spread ?? null,
      mark_vs_index: check.mark_vs_index.spread,
      rtoken_vs_mark: check.rtoken_vs_mark?.spread ?? null,
      ontoken_vs_rtoken: check.ontoken_vs_rtoken?.spread ?? null,
      ontoken_vs_mark: check.ontoken_vs_mark?.spread ?? null,
  
      // z-scores at open
      z_rtoken_vs_index: check.rtoken_vs_index?.z ?? null,
      z_mark_vs_index: check.mark_vs_index.z,
      z_rtoken_vs_mark: check.rtoken_vs_mark?.z ?? null,
      z_ontoken_vs_rtoken: check.ontoken_vs_rtoken?.z ?? null,
      z_ontoken_vs_mark: check.ontoken_vs_mark?.z ?? null,
  
      // simulated trade
      simulated_leg_long: legLong,
      simulated_leg_short: legShort,
      entry_price_long: entryLong,
      entry_price_short: entryShort,
      exit_price_long: null,
      exit_price_short: null,
  
      // costs
      fee_cost: null,
      slippage_cost: null,
      funding_cost: null,
      gross_pnl: null,
      net_pnl: null,
  
      resolution: "open",
      notes: null,
    };
  }

// ── Event close  

export function computeEventClose(
  event: DivergenceEvent,
  exitTick: Tick,
  currentCheck: DivergenceCheck,
  ticksSinceOpen: number,
  isFalseSignal: boolean
): Parameters<typeof import("./db").closeEvent>[1] {
  const exitLong =
    event.simulated_leg_long === "rtoken"
      ? exitTick.rtoken_price!
      : event.simulated_leg_long === "mark"
      ? exitTick.perp_mark!
      : exitTick.perp_index!;

  const exitShort =
    event.simulated_leg_short === "rtoken"
      ? exitTick.rtoken_price!
      : event.simulated_leg_short === "mark"
      ? exitTick.perp_mark!
      : exitTick.perp_index!;

  const grossPnl =
    (exitLong - event.entry_price_long) / event.entry_price_long -
    (exitShort - event.entry_price_short) / event.entry_price_short;

  // Fees: rtoken leg charges spot fee + slippage; perp leg charges taker fee + slippage
  const rtokenLegs = [event.simulated_leg_long, event.simulated_leg_short].filter(
    (l) => l === "rtoken"
  ).length;
  const perpLegs = 2 - rtokenLegs;

  const feeCost = rtokenLegs * SPOT_FEE * 2 + perpLegs * PERP_TAKER_FEE * 2;
  const slippageCost = rtokenLegs * SLIPPAGE_RTOKEN * 2 + perpLegs * SLIPPAGE_PERP * 2;

  // Funding: apply rate if held longer than threshold
  const holdMs = exitTick.ts - event.opened_at;
  const fundingRate = exitTick.funding_rate ?? 0;
  const fundingCost =
    holdMs > FUNDING_HOLD_THRESHOLD_MS ? Math.abs(fundingRate) : 0;

  const netPnl = grossPnl - feeCost - slippageCost - fundingCost;

  const resolution = isFalseSignal
    ? "false_signal"
    : ticksSinceOpen >= EVENT_TIMEOUT_TICKS
    ? "timeout"
    : "reverted";

  return {
    closed_at: exitTick.ts,
    exit_price_long: exitLong,
    exit_price_short: exitShort,
    fee_cost: feeCost,
    slippage_cost: slippageCost,
    funding_cost: fundingCost,
    gross_pnl: grossPnl,
    net_pnl: netPnl,
    resolution,
  };
}

// ── Should we close an open event?  

export function shouldCloseEvent(
  check: DivergenceCheck,
  ticksSinceOpen: number,
  isFalseSignal: boolean
): boolean {
  if (isFalseSignal) return true;
  if (ticksSinceOpen >= EVENT_TIMEOUT_TICKS) return true;
  const maxZ = Math.max(
    Math.abs(check.mark_vs_index.z),
    Math.abs(check.rtoken_vs_index?.z ?? 0),
    Math.abs(check.rtoken_vs_mark?.z ?? 0)
  );
  return maxZ < REVERSION_Z;
}