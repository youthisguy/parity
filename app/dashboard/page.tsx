import { DivergenceFeed } from "@/components/DivergenceCard";
import { Leaderboard } from "@/components/Leaderboard";
import { DashboardClient } from "@/components/DashboardClient";

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 antialiased">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-[#161616] bg-[#111111] backdrop-blur-md px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
  <div>
    <div className="flex items-center gap-1.5 select-none">
      {/* Logo image */}
      <img
        src="/parity-logo.png"
        alt="Parity logo"
        className="h-10 w-auto"
      />

      {/* Sharp, structural brand typography */}
      <h1 className="text-base font-black tracking-tight text-white font-sans uppercase">
        Parity
      </h1>

      {/* Flat, compact terminal-style monitor tag */}
      <span className="font-mono text-[9.5px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded-sm bg-zinc-800 text-cyan-400 border border-zinc-700">
        MONITOR
      </span>
    </div>
  </div>
</div>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2.5 px-1.5 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          {/* <span className="text-xs font-medium uppercase tracking-wider text-emerald-400 font-mono">
            LIVE FEED
          </span> */}
        </div>
      </header>

      {/* Main Content — client component owns the symbol state */}
      <DashboardClient />
    </main>
  );
}
