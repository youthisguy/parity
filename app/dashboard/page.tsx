import { DivergenceFeed } from "@/components/DivergenceCard";
import { Leaderboard } from "@/components/Leaderboard";
import { DashboardClient } from "@/components/DashboardClient";

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

      {/* Main Content — client component owns the symbol state */}
      <DashboardClient />
    </main>
  );
}