// ── Z-score threshold for flagging a divergence
export const Z_THRESHOLD = 5.0;

// ── Rolling window for mean/stdev calculation (number of ticks)
export const ROLLING_WINDOW = 360;

// ── Event timeout ticks
export const EVENT_TIMEOUT_TICKS = 120;

// ── Reversion threshold
export const REVERSION_Z = 0.5;

// ── False-signal filter
export const IMPLAUSIBLE_JUMP_PCT = 0.10;

// ── Execution cost assumptions — optimistic (maker + BGB discount)
// Assumptions: limit orders at bid/ask midpoint, BGB fee discount applied
export const SPOT_FEE = 0.0008;          // 0.08% per side (BGB discounted maker)
export const PERP_TAKER_FEE = 0.000065;  // 0.0065% per side (stock futures promo)
export const SLIPPAGE_RTOKEN = 0.0003;   // 0.03% per side (midpoint entry, thin book)
export const SLIPPAGE_PERP = 0.00005;    // 0.005% per side (midpoint, liquid book)
export const FUNDING_HOLD_THRESHOLD_MS = 4 * 60 * 60 * 1000;