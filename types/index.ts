export type AssetClass = "stock" | "crypto";
export type ProductType = "USDT-FUTURES" | "SUSDT-FUTURES";

export interface Tick {
  id?: number;
  symbol: string;
  asset_class: AssetClass;
  ts: number;
  rtoken_price: number | null;
  ontoken_price: number | null;   
  perp_mark: number | null;
  perp_index: number | null;
  funding_rate: number | null;
}

export interface DivergenceEvent {
  id?: number;
  symbol: string;
  asset_class: AssetClass;
  opened_at: number;
  closed_at: number | null;
  // spreads at open
  rtoken_vs_index: number | null;
  mark_vs_index: number;
  rtoken_vs_mark: number | null;
  ontoken_vs_rtoken: number | null;  
  ontoken_vs_mark: number | null;    
  // z-scores at open
  z_rtoken_vs_index: number | null;
  z_mark_vs_index: number;
  z_rtoken_vs_mark: number | null;
  z_ontoken_vs_rtoken: number | null; 
  z_ontoken_vs_mark: number | null;   
  // simulated trade
  simulated_leg_long: "rtoken" | "ontoken" | "mark" | "index_proxy";
  simulated_leg_short: "rtoken" | "ontoken" | "mark" | "index_proxy";
  entry_price_long: number;
  entry_price_short: number;
  exit_price_long: number | null;
  exit_price_short: number | null;
  // costs
  fee_cost: number | null;
  slippage_cost: number | null;
  funding_cost: number | null;
  gross_pnl: number | null;
  net_pnl: number | null;
  // resolution
  resolution: "reverted" | "timeout" | "false_signal" | "open";
  notes: string | null;
}

export interface SpreadStats {
  mean: number;
  stdev: number;
  z: number;
  spread: number;
}

export interface DivergenceCheck {
  symbol: string;
  ts: number;
  rtoken_vs_index: SpreadStats | null;
  mark_vs_index: SpreadStats;
  rtoken_vs_mark: SpreadStats | null;
  ontoken_vs_rtoken: SpreadStats | null;   
  ontoken_vs_mark: SpreadStats | null;    
  flagged: boolean;
  active_event_id: number | null;
}

export interface LeaderboardRow {
  symbol: string;
  asset_class: AssetClass;
  event_count: number;
  avg_z: number;
  avg_net_pnl: number;
  total_net_pnl: number;
  last_seen: number;
}