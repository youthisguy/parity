"use client";

import { useEffect, useState } from "react";
import type { DivergenceEvent } from "@/types";

function badge(resolution: DivergenceEvent["resolution"]) {
  const map: Record<string, string> = {
    open: "bg-yellow-500/20 text-yellow-300",
    reverted: "bg-green-500/20 text-green-300",
    timeout: "bg-red-500/20 text-red-300",
    false_signal: "bg-gray-500/20 text-gray-400",
  };
  return map[resolution] ?? "bg-gray-700 text-gray-300";
}

function pnlColor(val: number | null) {
  if (val == null) return "text-gray-400";
  return val >= 0 ? "text-green-400" : "text-red-400";
}

export function DivergenceCard({ event }: { event: DivergenceEvent }) {
  return (
    <div className="border border-white/10 rounded-lg p-4 bg-white/2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-white">{event.symbol}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge(event.resolution)}`}>
          {event.resolution}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-gray-500">z mark/idx</p>
          <p className="text-white font-mono">{event.z_mark_vs_index.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">z rtoken/idx</p>
          <p className="text-white font-mono">{event.z_rtoken_vs_index?.toFixed(2) ?? "—"}</p>
        </div>
        <div>
          <p className="text-gray-500">z rtoken/mark</p>
          <p className="text-white font-mono">{event.z_rtoken_vs_mark?.toFixed(2) ?? "—"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs border-t border-white/5 pt-2">
        <span className="text-gray-500">
          {new Date(event.opened_at).toLocaleTimeString()}
          {event.closed_at && ` → ${new Date(event.closed_at).toLocaleTimeString()}`}
        </span>
        <span className={`font-mono font-semibold ${pnlColor(event.net_pnl)}`}>
          {event.net_pnl != null ? `${(event.net_pnl * 100).toFixed(3)}%` : "open"}
        </span>
      </div>
    </div>
  );
}

export function DivergenceFeed() {
  const [events, setEvents] = useState<DivergenceEvent[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/divergences?limit=20");
      const data = await res.json();
      setEvents(data.events ?? []);
    }
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  if (events.length === 0) {
    return <p className="text-sm text-gray-500">No divergence events yet.</p>;
  }

  return (
    <div className="space-y-3">
      {events.map((e) => (
        <DivergenceCard key={e.id} event={e} />
      ))}
    </div>
  );
}