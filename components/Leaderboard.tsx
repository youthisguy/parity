"use client";

import { useEffect, useState } from "react";
import type { LeaderboardRow } from "@/types";

export function Leaderboard() {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/leaderboard");
      const data = await res.json();
      setRows(data.leaderboard ?? []);
    }
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  if (rows.length === 0) {
    return <p className="text-sm text-gray-500">No data yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs font-mono">
        <thead>
          <tr className="text-gray-500 border-b border-white/10">
            <th className="text-left py-2 pr-4">Symbol</th>
            <th className="text-left py-2 pr-4">Type</th>
            <th className="text-right py-2 pr-4">Events</th>
            <th className="text-right py-2 pr-4">Avg |z|</th>
            <th className="text-right py-2 pr-4">Avg net P&amp;L</th>
            <th className="text-right py-2">Total P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.symbol}
              className="border-b border-white/5 hover:bg-white/2 transition-colors"
            >
              <td className="py-2 pr-4 text-white font-semibold">{r.symbol}</td>
              <td className="py-2 pr-4">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    r.asset_class === "stock"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {r.asset_class}
                </span>
              </td>
              <td className="py-2 pr-4 text-right text-gray-300">{r.event_count}</td>
              <td className="py-2 pr-4 text-right text-white">{r.avg_z.toFixed(2)}</td>
              <td
                className={`py-2 pr-4 text-right ${
                  r.avg_net_pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {(r.avg_net_pnl * 100).toFixed(3)}%
              </td>
              <td
                className={`py-2 text-right ${
                  r.total_net_pnl >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {(r.total_net_pnl * 100).toFixed(3)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}