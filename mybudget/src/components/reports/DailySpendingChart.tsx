"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisCurrency } from "@/components/reports/chart-utils";
import { formatCurrency } from "@/lib/currency";

export type WeekdaySpendingPoint = {
  day: string;
  amount: number;
};

type TooltipPayloadItem = {
  payload?: WeekdaySpendingPoint;
};

function WeekdayTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="border border-ink/20 bg-paper px-3 py-2 text-xs shadow-sm dark:border-white/15 dark:bg-[#211b17]">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
        {point.day}
      </p>
      <p className="mt-1 font-semibold tabular-nums text-ink dark:text-[#f7eddd]">
        {formatCurrency(point.amount)}
      </p>
    </div>
  );
}

export function DailySpendingChart({ data }: { data: WeekdaySpendingPoint[] }) {
  const hasSpending = data.some((point) => point.amount > 0);

  if (!hasSpending) {
    return (
      <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
        No expenses recorded yet to show day-of-week patterns.
      </p>
    );
  }

  return (
    <div className="mt-5 h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="rgba(107,74,44,0.14)" />
          <XAxis
            dataKey="day"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: "#6b4a2c" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#6b4a2c" }}
            tickFormatter={formatAxisCurrency}
            width={52}
          />
          <Tooltip
            cursor={{ fill: "rgba(184, 95, 36, 0.08)" }}
            content={<WeekdayTooltip />}
          />
          <Bar
            dataKey="amount"
            fill="#b85f24"
            radius={[2, 2, 0, 0]}
            maxBarSize={36}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
