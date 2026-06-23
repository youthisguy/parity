// ── Z-score threshold for flagging a divergence
export const Z_THRESHOLD = 2.5;

// ── Rolling window for mean/stdev calculation (number of ticks)
// At 5s polling that's 12 ticks/min → 360 = 30 min window
export const ROLLING_WINDOW = 360;

// ── Event timeout: close as "timeout" if spread hasn't reverted after N ticks
export const EVENT_TIMEOUT_TICKS = 720; // ~60 min at 5s

// ── Reversion threshold: close event when |z| drops below this
export const REVERSION_Z = 0.5;

// ── False-signal filter: reject a tick if any price jumps more than this % in one step
export const IMPLAUSIBLE_JUMP_PCT = 0.10; // 10%

// ── Execution cost assumptions (all as decimal fractions)
export const SPOT_FEE = 0.001;        // 0.1% maker/taker on rToken
export const PERP_TAKER_FEE = 0.0006; // 0.06% taker on perp
export const SLIPPAGE_RTOKEN = 0.002;  // 0.2% assumed slippage on thin rToken book
export const SLIPPAGE_PERP = 0.0005;   // 0.05% on liquid perp

// ── Funding rate cost: fraction of funding rate charged per event if held across interval
// Bitget stock perps settle funding every 8h; we apply the full rate if held > 4h
export const FUNDING_HOLD_THRESHOLD_MS = 4 * 60 * 60 * 1000;