import Database from "better-sqlite3";
import path from "path";
import type { Tick, DivergenceEvent, LeaderboardRow } from "@/types";

const DB_PATH = path.join(process.cwd(), "parity.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS ticks (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol        TEXT    NOT NULL,
        asset_class   TEXT    NOT NULL DEFAULT 'stock',
        ts            INTEGER NOT NULL,
        rtoken_price  REAL,
        ontoken_price REAL,
        perp_mark     REAL,
        perp_index    REAL,
        funding_rate  REAL
      );
  
      CREATE INDEX IF NOT EXISTS idx_ticks_symbol_ts ON ticks(symbol, ts);
  
      CREATE TABLE IF NOT EXISTS divergence_events (
        id                    INTEGER PRIMARY KEY AUTOINCREMENT,
        symbol                TEXT    NOT NULL,
        asset_class           TEXT    NOT NULL DEFAULT 'stock',
        opened_at             INTEGER NOT NULL,
        closed_at             INTEGER,
        rtoken_vs_index       REAL,
        mark_vs_index         REAL    NOT NULL,
        rtoken_vs_mark        REAL,
        ontoken_vs_rtoken     REAL,
        ontoken_vs_mark       REAL,
        z_rtoken_vs_index     REAL,
        z_mark_vs_index       REAL    NOT NULL,
        z_rtoken_vs_mark      REAL,
        z_ontoken_vs_rtoken   REAL,
        z_ontoken_vs_mark     REAL,
        simulated_leg_long    TEXT    NOT NULL,
        simulated_leg_short   TEXT    NOT NULL,
        entry_price_long      REAL    NOT NULL,
        entry_price_short     REAL    NOT NULL,
        exit_price_long       REAL,
        exit_price_short      REAL,
        fee_cost              REAL,
        slippage_cost         REAL,
        funding_cost          REAL,
        gross_pnl             REAL,
        net_pnl               REAL,
        resolution            TEXT    NOT NULL DEFAULT 'open',
        notes                 TEXT
      );
  
      CREATE INDEX IF NOT EXISTS idx_events_symbol ON divergence_events(symbol);
      CREATE INDEX IF NOT EXISTS idx_events_resolution ON divergence_events(resolution);
    `);
  }
  
export function insertTick(tick: Omit<Tick, "id">): number {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO ticks (symbol, asset_class, ts, rtoken_price, ontoken_price, perp_mark, perp_index, funding_rate)
      VALUES (@symbol, @asset_class, @ts, @rtoken_price, @ontoken_price, @perp_mark, @perp_index, @funding_rate)
    `);
    return stmt.run(tick).lastInsertRowid as number;
  }
 

export function getRecentTicks(symbol: string, limit: number): Tick[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM ticks WHERE symbol = ? ORDER BY ts DESC LIMIT ?`)
    .all(symbol, limit) as Tick[];
}

export function getTicksInRange(
  symbol: string,
  fromTs: number,
  toTs: number
): Tick[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM ticks WHERE symbol = ? AND ts BETWEEN ? AND ? ORDER BY ts ASC`
    )
    .all(symbol, fromTs, toTs) as Tick[];
}

export function getAllSymbols(): { symbol: string; asset_class: string }[] {
  const db = getDb();
  return db.prepare(`SELECT DISTINCT symbol, asset_class FROM ticks`).all() as {
    symbol: string;
    asset_class: string;
  }[];
}

// ── Divergence Events
export function insertEvent(event: Omit<DivergenceEvent, "id">): number {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO divergence_events (
      symbol, asset_class, opened_at, closed_at,
      rtoken_vs_index, mark_vs_index, rtoken_vs_mark,
      z_rtoken_vs_index, z_mark_vs_index, z_rtoken_vs_mark,
      simulated_leg_long, simulated_leg_short,
      entry_price_long, entry_price_short,
      exit_price_long, exit_price_short,
      fee_cost, slippage_cost, funding_cost,
      gross_pnl, net_pnl, resolution, notes
    ) VALUES (
      @symbol, @asset_class, @opened_at, @closed_at,
      @rtoken_vs_index, @mark_vs_index, @rtoken_vs_mark,
      @z_rtoken_vs_index, @z_mark_vs_index, @z_rtoken_vs_mark,
      @simulated_leg_long, @simulated_leg_short,
      @entry_price_long, @entry_price_short,
      @exit_price_long, @exit_price_short,
      @fee_cost, @slippage_cost, @funding_cost,
      @gross_pnl, @net_pnl, @resolution, @notes
    )
  `);
  return stmt.run(event).lastInsertRowid as number;
}

export function closeEvent(
  id: number,
  patch: Pick<
    DivergenceEvent,
    | "closed_at"
    | "exit_price_long"
    | "exit_price_short"
    | "fee_cost"
    | "slippage_cost"
    | "funding_cost"
    | "gross_pnl"
    | "net_pnl"
    | "resolution"
  >
): void {
  const db = getDb();
  db.prepare(
    `
    UPDATE divergence_events SET
      closed_at = @closed_at,
      exit_price_long = @exit_price_long,
      exit_price_short = @exit_price_short,
      fee_cost = @fee_cost,
      slippage_cost = @slippage_cost,
      funding_cost = @funding_cost,
      gross_pnl = @gross_pnl,
      net_pnl = @net_pnl,
      resolution = @resolution
    WHERE id = @id
  `
  ).run({ ...patch, id });
}

export function getOpenEvents(): DivergenceEvent[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM divergence_events WHERE resolution = 'open' ORDER BY opened_at DESC`
    )
    .all() as DivergenceEvent[];
}

export function getRecentEvents(limit = 50): DivergenceEvent[] {
  const db = getDb();
  return db
    .prepare(`SELECT * FROM divergence_events ORDER BY opened_at DESC LIMIT ?`)
    .all(limit) as DivergenceEvent[];
}

export function getEventById(id: number): DivergenceEvent | undefined {
  const db = getDb();
  return db.prepare(`SELECT * FROM divergence_events WHERE id = ?`).get(id) as
    | DivergenceEvent
    | undefined;
}

// ── Leaderboard
export function getLeaderboard(): LeaderboardRow[] {
  const db = getDb();
  return db
    .prepare(
      `
    SELECT
      symbol,
      asset_class,
      COUNT(*) as event_count,
      AVG(ABS(z_mark_vs_index)) as avg_z,
      AVG(COALESCE(net_pnl, 0)) as avg_net_pnl,
      SUM(CASE WHEN net_pnl > 0 THEN net_pnl ELSE 0 END) as total_net_pnl,
      MAX(opened_at) as last_seen
    FROM divergence_events
    WHERE resolution != 'false_signal'
    GROUP BY symbol, asset_class
    ORDER BY avg_z DESC
  `
    )
    .all() as LeaderboardRow[];
}
