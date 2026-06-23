"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { Tick } from "@/types";

interface Props {
  symbol: string;
}

function fmt(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function PriceChart({ symbol }: Props) {
  const [ticks, setTicks] = useState<Tick[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/ticks?symbol=${symbol}&limit=120`);
      const data = await res.json();
      if (!cancelled) setTicks(data.ticks ?? []);
    }

    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, [symbol]);

  const chartData = ticks.map((t) => ({
    ts: fmt(t.ts),
    rToken: t.rtoken_price,
    mark: t.perp_mark,
    index: t.perp_index,
  }));

  // compute a rough spread series for the secondary axis
  const spreadData = ticks.map((t) => ({
    ts: fmt(t.ts),
    markVsIndex:
      t.perp_mark != null && t.perp_index != null && t.perp_index !== 0
        ? ((t.perp_mark - t.perp_index) / t.perp_index) * 100
        : null,
  }));

  if (ticks.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-gray-400">
        Waiting for ticks — is the poller running?
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Three-venue prices</p>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <XAxis dataKey="ts" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#0f0f0f", border: "1px solid #333", fontSize: 12 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="rToken" stroke="#22d3ee" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="mark" stroke="#a78bfa" dot={false} strokeWidth={1.5} />
            <Line type="monotone" dataKey="index" stroke="#fb923c" dot={false} strokeWidth={1.5} strokeDasharray="4 2" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2 uppercase tracking-widest">Mark vs Index spread (%)</p>
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={spreadData}>
            <XAxis dataKey="ts" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip
              contentStyle={{ background: "#0f0f0f", border: "1px solid #333", fontSize: 12 }}
            />
            <ReferenceLine y={0} stroke="#444" />
            <Line type="monotone" dataKey="markVsIndex" stroke="#34d399" dot={false} strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}