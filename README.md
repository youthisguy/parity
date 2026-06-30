# Parity - Tri-Venue Divergence Monitor

> Real-time price dislocation detection across Bitget's three parallel US stock venues.  

---

## What is Parity?

Bitget lists the same US equity in three parallel, Bitget-native venues simultaneously:

| Venue | Example | Description |
|---|---|---|
| **rToken spot** | `RTSLAUSDT` | Tokenized stock, traded on Bitget spot order book |
| **onToken spot** | `TSLAONUSDT` | Second onchain token, thinner book |
| **Perp mark price** | `TSLAUSDT` | Bitget's fair-value price for the futures contract |
| **Perp index price** | `TSLAUSDT` | Bitget's reference price, tracks real-world NASDAQ |

In an efficient market these four prices are identical. In practice they drift. **Parity is the missing observability layer** — it monitors all four venues in real time, detects statistically unusual dislocations, and logs every event with full cost-modeled simulated P&L.

It is also designed as **agent-callable infrastructure**: any trading agent can hit the MCP endpoints to check divergence state before entering a position, without running the full stack themselves. Beyond detection, Parity includes an execution layer that autonomously trades the convergence signal directly on Bitget when net edge clears a configurable cost threshold — see [Execution Agent](#execution-agent-v2) below.

---

## Architecture

```
parity/              ← Next.js app 
  app/
    api/
      ticks/         ← POST: ingest ticks | GET: query recent ticks
      divergences/   ← GET: recent divergence events
      leaderboard/   ← GET: ranked dislocation summary
      events/        ← POST: open event | PATCH: close event | DELETE: bulk close
      mcp/
        check_divergence/     ← MCP tool: current divergence state for a symbol
        active_divergences/   ← MCP tool: all currently open simulated events
        execute_trade/        ← MCP tool: places real long rToken + short perp orders if net edge clears threshold
        close_trade/          ← MCP tool: flattens both legs of an open position
    dashboard/       ← Live dashboard UI
  lib/
    db.ts            ← Turso (libSQL over HTTP) persistence
    engine.ts        ← Rolling z-score engine + event lifecycle
    constants.ts     ← Thresholds, cost assumptions, window sizes
    bitget-auth.ts   ← HMAC-SHA256 request signing + symbol mapping for execution
  components/
    PriceChart.tsx       ← Live three-venue price chart + spread chart
    DivergenceCard.tsx   ← Per-event card with P&L and resolution status
    DashboardClient.tsx  ← Symbol selector + layout
    Leaderboard.tsx      ← Ranked table across all symbols
  types/index.ts     ← Shared TypeScript types

parity-poller/       ← Express app (port 3001)
  src/
    bitget.ts        ← Bitget REST API calls with timeout + error handling
    index.ts         ← Poll loop + engine trigger + execution/close calls + /health /status endpoints
```

**Data flow:**

```
Bitget API
    ↓  (every 5s)
parity-poller  →  POST /api/ticks  →  parity (Next.js)
                                           ↓
                                      Turso (libSQL)
                                           ↓
parity-poller  →  GET /api/mcp/check_divergence  →  z-score engine
                                                         ↓
                                ┌────────────────────────┴────────────────────────┐
                                ↓                                                 ↓
                      divergence_events table                      execute_trade / close_trade
                      (simulated log, always written)               (real signed orders, when
                                ↓                                    net edge clears threshold)
                      Dashboard + MCP endpoints                                  ↓
                                                                        Bitget sub-account
                                                                    (spot + futures wallets)
```

---

## Core Engine

### Spreads tracked (per tick, per symbol)

| Spread | Formula | What it detects |
|---|---|---|
| `rtoken_vs_index` | `(rToken − index) / index` | rToken mispriced vs real-world reference |
| `mark_vs_index` | `(mark − index) / index` | Futures fair value drift from reference |
| `rtoken_vs_mark` | `(rToken − mark) / mark` | rToken vs futures divergence |
| `ontoken_vs_rtoken` | `(onToken − rToken) / rToken` | Two spot venues diverging |
| `ontoken_vs_mark` | `(onToken − mark) / mark` | onToken vs futures |

### Z-score flagging

For each spread, the engine maintains a rolling window of the last **360 ticks (~30 minutes at 5s polling)**. It computes the rolling mean and standard deviation, then flags when:

```
|z| = |(current_spread − rolling_mean) / rolling_stdev| > 2.5
```

This means "this spread is unusual *for this stock right now*" — not just "any gap exists." It self-adjusts to each stock's natural volatility.

### Cost-modeled simulated P&L

Every flagged event simulates the convergence trade and subtracts realistic execution costs across two scenarios — conservative (standard retail) and optimistic (BGB discount + active stock futures promo). 

All cost parameters are centralized in `lib/constants.ts` and applied consistently across every simulated event — no cherry-picking per trade.

Events close when the z-score reverts below 0.5, times out after 720 ticks (~60 min), or is flagged as a false signal (implausible price jump > 10% in one tick).

### Fee assumptions

The default constants model conservative fees. With BGB discount and Bitget's active stock futures promo (valid through June 30, 2026), realistic round-trip costs drop significantly:

| Cost | Conservative | Optimistic (BGB + promo) | Rationale |
|---|---|---|---|
| Spot fee (rToken) | 0.1% per side | 0.08% per side | BGB 20% discount on spot |
| Perp taker fee | 0.06% per side | 0.0065% per side | Stock futures promo rate |
| rToken slippage | 0.2% per side | 0.06% per side | Limit orders, patient fill |
| Perp slippage | 0.05% per side | 0.01% per side | Deep perp book |
| **Total round-trip** | **~0.81%** | **~0.175%** | |

Update `lib/constants.ts` to switch between scenarios.

---

---

## Execution Agent (v2)

Beyond detection, Parity includes an experimental autonomous execution layer that attempts to trade the convergence signal directly on Bitget.

### How it works

1. **Detect** — the existing z-score engine flags a dislocation (|z| > 3.5)
2. **Decide** — `execute_trade` recomputes net edge (gross spread minus the optimistic cost floor of ~0.175–0.25%) and only proceeds if net edge clears 0.3%
3. **Execute** — places two simultaneous signed limit orders: long rToken spot, short perp futures, sized at a fixed USDT notional per leg
4. **Monitor** — the poller re-checks every 5s; when the spread reverts (or after a 60-minute timeout), `close_trade` flattens both legs

### Execution endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/mcp/execute_trade` | POST | Places long rToken + short perp limit orders if net edge clears threshold |
| `/api/mcp/close_trade` | POST | Flattens both legs — checks rToken balance, sells spot, buys back perp |

## MCP / Agent Hub Endpoints

These endpoints are stable, unauthenticated, and designed to be called by trading agents.

### `GET /api/mcp/check_divergence?symbol=TSLAUSDT`

Returns the current divergence state for a symbol. Agents call this before entering a position.

```json
{
  "tool": "check_divergence",
  "symbol": "TSLAUSDT",
  "ts": 1782242810881,
  "flagged": false,
  "spreads": {
    "rtoken_vs_index":   { "spread": -0.000611, "z":  1.09, "mean": -0.000737, "stdev": 0.000115 },
    "mark_vs_index":     { "spread": -0.0000096,"z": -0.94, "mean":  0.000097, "stdev": 0.000114 },
    "rtoken_vs_mark":    { "spread": -0.000602, "z":  1.56, "mean": -0.000834, "stdev": 0.000149 },
    "ontoken_vs_rtoken": { "spread":  0.000681, "z":  0.27, "mean":  0.000487, "stdev": 0.000730 },
    "ontoken_vs_mark":   { "spread":  0.0000785,"z":  0.61, "mean": -0.000350, "stdev": 0.000703 }
  },
  "prices": {
    "rtoken":     381.92,
    "ontoken":    382.18,
    "perp_mark":  382.15,
    "perp_index": 382.1537
  }
}
```

### `GET /api/mcp/active_divergences`

Returns all currently open simulated events across all symbols.

```json
{
  "tool": "get_active_divergences",
  "count": 1,
  "events": [
    {
      "id": 42,
      "symbol": "TSLAUSDT",
      "asset_class": "stock",
      "opened_at": 1782237000000,
      "z_mark_vs_index": 0.2,
      "z_rtoken_vs_index": 2.9,
      "z_rtoken_vs_mark": 2.7,
      "simulated_legs": "long rtoken / short mark"
    }
  ]
}
```

---

## Supported Symbols

| Ticker | rToken | onToken | Perp |
|---|---|---|---|
| TSLA | `RTSLAUSDT` | `TSLAONUSDT` | `TSLAUSDT` |
| AAPL | `RAAPLUSDT` | `AAPLONUSDT` | `AAPLUSDT` |
| GOOGL | `RGOOGLUSDT` | `GOOGLONUSDT` | `GOOGLUSDT` |
| MSFT | `RMSFTUSDT` | `MSFTONUSDT` | `MSFTUSDT` |
| AMZN | `RAMZNUSDT` | `AMZNONUSDT` | `AMZNUSDT` |

All symbols verified live against Bitget API. Product type: `USDT-FUTURES`.

---

## Getting Started

### Prerequisites

- Node.js 18+
- Two terminal sessions (Next.js app + poller)

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/parity
cd parity && npm install
cd ../parity-poller && npm install
```

### 2. Configure environment

```bash
# parity/.env.local
POLLER_URL=http://localhost:3001
TURSO_URL=libsql://your-db.turso.io
TURSO_TOKEN=your-token-here

# parity-poller/.env
NEXT_URL=http://localhost:3000
PORT=3001
POLL_INTERVAL_MS=5000
```

### 3. Start the Next.js app

```bash
cd parity
npm run dev
# → http://localhost:3000
```

### 4. Start the poller

```bash
cd parity-poller
npm run dev
# → Inserts 5 ticks every 5s
# → Calls /api/mcp/check_divergence after each batch
```

### 5. Open the dashboard

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

The price chart populates immediately. The z-score engine needs **~30 minutes of ticks** (~360 per symbol) before the rolling baseline is meaningful and divergence events will start firing.

---

## Dashboard

The dashboard shows:

- **Symbol selector** — switch between TSLA, AAPL, GOOGL, MSFT, AMZN
- **Three-venue price chart** — live rToken, mark, and index price lines
- **Mark vs Index spread (%)** — secondary chart showing the tightest spread in real time
- **Dislocation leaderboard** — all symbols ranked by average z-score, with total simulated P&L
- **Recent divergence events** — per-event cards showing z-scores, legs, resolution status, and net P&L after costs
- **MCP endpoint reference** — live URLs for the currently selected symbol

---
 
## Project Structure — Key Files

| File | Purpose |
|---|---|
| `lib/engine.ts` | Z-score computation, spread calculation, event open/close logic |
| `lib/db.ts` | Turso (libSQL over HTTP) schema, tick insert, event CRUD, leaderboard query |
| `lib/constants.ts` | All thresholds and cost parameters in one place |
| `app/api/mcp/` | Agent-callable endpoints |
| `parity-poller/src/index.ts` | Poll loop, engine trigger, status server |
| `parity-poller/src/bitget.ts` | Bitget API calls with timeout and null-safe error handling |

---

## Live Deployment

- **Dashboard:** https://parity-monitor.up.railway.app/dashboard
- **MCP check:** https://parity-monitor.up.railway.app/api/mcp/check_divergence?symbol=TSLAUSDT
- **Active divergences:** https://parity-monitor.up.railway.app/api/mcp/active_divergences
- **Poller status:** https://parity-poller.onrender.com/status
- **Poller repo:** https://github.com/youthisguy/parity-poller

---

## Bitget APIs Used

- `GET /api/v2/spot/market/tickers?symbol=RTSLAUSDT` — rToken spot price
- `GET /api/v2/spot/market/tickers?symbol=TSLAONUSDT` — onToken spot price  
- `GET /api/v2/mix/market/ticker?symbol=TSLAUSDT&productType=USDT-FUTURES` — perp mark, index, funding rate
- `GET /api/v2/spot/public/symbols` — symbol discovery (used during development)
- `GET /api/v2/mix/market/contracts?productType=USDT-FUTURES` — contract discovery
