"use client";

import { useState } from "react";
import { PriceChart } from "@/components/PriceChart";
import { DivergenceFeed } from "@/components/DivergenceCard";
import { Leaderboard } from "@/components/Leaderboard";

const SYMBOLS = [
  { perp: "TSLAUSDT",  label: "TSLA",  name: "Tesla" },
  { perp: "AAPLUSDT",  label: "AAPL",  name: "Apple" },
  { perp: "GOOGLUSDT", label: "GOOGL", name: "Alphabet" },
  { perp: "MSFTUSDT",  label: "MSFT",  name: "Microsoft" },
  { perp: "AMZNUSDT",  label: "AMZN",  name: "Amazon" },
//   { perp: "NVDAUSDT",  label: "NVDA",  name: "NVIDIA" },
];

export function DashboardClient() {
  const [selected, setSelected] = useState(SYMBOLS[0]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

      {/* Symbol Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {SYMBOLS.map((s) => (
          <button
            key={s.perp}
            onClick={() => setSelected(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
              selected.perp === s.perp
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                : "bg-slate-900/60 text-slate-400 border-slate-700/60 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {s.label}
            <span className={`ml-1.5 text-[10px] font-normal ${selected.perp === s.perp ? "text-cyan-400/70" : "text-slate-600"}`}>
              {s.name}
            </span>
          </button>
        ))}
      </div>

      {/* Featured Price Chart Section */}
      <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/20">
          <div className="flex items-center gap-3">
            <span className="bg-slate-800 text-slate-200 text-xs font-mono font-bold px-2 py-1 rounded tracking-wide">
              {selected.perp}
            </span>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Three-Venue Price Dislocation
            </h2>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Updated millisecond-level
          </div>
        </div>
        <div className="p-6 bg-slate-950/40">
          <PriceChart symbol={selected.perp} />
        </div>
      </section>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="border-b border-slate-800 px-5 py-4 bg-slate-900/20">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Dislocation Leaderboard
            </h2>
            <p className="text-[11px] text-slate-600 mt-0.5">All symbols · ranked by avg z-score</p>
          </div>
          <div className="p-5 flex-1 bg-slate-950/40">
            <Leaderboard />
          </div>
        </section>

        <section className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl">
          <div className="border-b border-slate-800 px-5 py-4 bg-slate-900/20 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Divergence Events
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">All symbols · simulated P&L included</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
              Real-time stream
            </span>
          </div>
          <div className="p-5 max-h-[460px] overflow-y-auto bg-slate-950/40">
            <DivergenceFeed />
          </div>
        </section>
      </div>

      {/* MCP Endpoints */}
      <section className="bg-slate-900/30 border border-slate-800/60 rounded-xl overflow-hidden">
        <div className="border-b border-slate-800/60 px-5 py-3.5 bg-slate-900/10">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            Agent Hub / MCP Endpoints
          </h2>
        </div>
        <div className="p-5 font-mono text-xs space-y-3 bg-slate-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded bg-slate-900/50 border border-slate-800/40">
            <span className="w-12 text-center font-bold text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">GET</span>
            <span className="text-slate-300 break-all select-all">/api/mcp/check_divergence?symbol={selected.perp}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded bg-slate-900/50 border border-slate-800/40">
            <span className="w-12 text-center font-bold text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">GET</span>
            <span className="text-slate-300 break-all select-all">/api/mcp/active_divergences</span>
          </div>
          <p className="text-slate-500 text-[11px] italic pt-1 pl-1">
             agent-callable JSON
          </p>
        </div>
      </section>

    </div>
  );
}