import { PriceChart } from "@/components/PriceChart";
import { DivergenceFeed } from "@/components/DivergenceCard";
import { Leaderboard } from "@/components/Leaderboard";

const FEATURED_SYMBOL = "TSLAUSDT";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0B0C0E] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#0B0C0E]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                PRO
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white">Parity</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Tri-venue divergence monitor</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">Bitget US Stocks</span>
            </p>
          </div>
        </div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-400 font-mono">
            LIVE FEED
          </span>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Featured Price Chart Section */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between bg-slate-900/20">
            <div className="flex items-center gap-3">
              <span className="bg-slate-800 text-slate-200 text-xs font-mono font-bold px-2 py-1 rounded tracking-wide">
                {FEATURED_SYMBOL}
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
            <PriceChart symbol={FEATURED_SYMBOL} />
          </div>
        </section>

        {/* Analytics Grid: Leaderboard & Recent Feeds */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Dislocation Leaderboard */}
          <section className="lg:col-span-5 bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl">
            <div className="border-b border-slate-800 px-5 py-4 bg-slate-900/20">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Dislocation Leaderboard
              </h2>
            </div>
            <div className="p-5 flex-1 bg-slate-950/40">
              <Leaderboard />
            </div>
          </section>

          {/* Recent Divergence Events */}
          <section className="lg:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col shadow-xl">
            <div className="border-b border-slate-800 px-5 py-4 bg-slate-900/20 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Recent Divergence Events
              </h2>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                Real-time stream
              </span>
            </div>
            <div className="p-5 max-h-[460px] overflow-y-auto custom-scrollbar bg-slate-950/40">
              <DivergenceFeed />
            </div>
          </section>
        </div>

        {/* Developer / MCP Tool References */}
        <section className="bg-slate-900/30 border border-slate-800/60 rounded-xl overflow-hidden">
          <div className="border-b border-slate-800/60 px-5 py-3.5 bg-slate-900/10">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              Agent Hub / MCP Endpoints
            </h2>
          </div>
          <div className="p-5 font-mono text-xs space-y-3 bg-slate-950/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded bg-slate-900/50 border border-slate-800/40">
              <span className="w-12 text-center font-bold text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">
                GET
              </span>
              <span className="text-slate-300 break-all select-all">
                /api/mcp/check_divergence?symbol=TSLAUSDT
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-2.5 rounded bg-slate-900/50 border border-slate-800/40">
              <span className="w-12 text-center font-bold text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded shrink-0">
                GET
              </span>
              <span className="text-slate-300 break-all select-all">
                /api/mcp/active_divergences
              </span>
            </div>
            
            <p className="text-slate-500 text-[11px] italic pt-1 pl-1">
              Stable, agent-callable JSON — same engine, no auth required.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}