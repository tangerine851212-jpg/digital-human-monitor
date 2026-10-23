"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardTopItem, DashboardTrendPoint } from "@/lib/analytics/contracts";
import { formatNumber } from "@/lib/utils";

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name?: string }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,250,245,0.94)] px-4 py-3 text-sm shadow-[var(--shadow-card)] backdrop-blur">
      {label ? <p className="mb-1 text-[var(--ink-2)]">{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name} className="font-medium text-[var(--ink-1)]">
          {item.name ?? "总量"}: {formatNumber(item.value)}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  activityTrend,
  topEvents,
}: {
  activityTrend: DashboardTrendPoint[];
  topEvents: DashboardTopItem[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
      <section className="soft-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">陪伴趋势</p>
            <h3 className="text-2xl font-semibold text-[var(--ink-1)]">最近互动走势</h3>
          </div>
          <p className="text-sm text-[var(--ink-3)]">看什么时候更活跃，什么时候需要多留意</p>
        </div>

        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityTrend} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#c75e37" stopOpacity={0.65} />
                  <stop offset="100%" stopColor="#c75e37" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(93, 70, 48, 0.12)" vertical={false} />
              <XAxis dataKey="bucket" tickLine={false} axisLine={false} dy={8} tick={{ fill: "#7b6a59", fontSize: 12 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fill: "#7b6a59", fontSize: 12 }} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="记录数"
                stroke="#b6522d"
                strokeWidth={3}
                fill="url(#trendFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="soft-card p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">高频动作</p>
            <h3 className="text-2xl font-semibold text-[var(--ink-1)]">最常发生的陪伴操作</h3>
          </div>
          <p className="text-sm text-[var(--ink-3)]">最近大家更常用哪项能力，这里最直观</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topEvents} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid stroke="rgba(93, 70, 48, 0.12)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="label"
                type="category"
                width={128}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#7b6a59", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="total" name="次数" fill="#1d6f68" radius={[0, 12, 12, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}