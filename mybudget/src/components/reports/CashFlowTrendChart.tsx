"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatAxisCurrency } from "@/components/reports/chart-utils";
import { formatCurrency } from "@/lib/currency";

export type MonthlyCashFlowPoint = {
  monthKey: string;
  month: string;
  income: number;
  expenses: number;
  savings: number;
};

type TooltipPayloadItem = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
  payload?: MonthlyCashFlowPoint;
};

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="border border-ink/20 bg-paper px-3.5 py-2.5 text-xs shadow-sm dark:border-white/15 dark:bg-[#211b17]">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
        {point?.month}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-5">
            <span className="flex items-center gap-1.5 text-ink-soft dark:text-[#cfc2af]">
              <span className="inline-block size-2" style={{ backgroundColor: entry.color }} />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-ink dark:text-[#f7eddd]">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CashFlowTrendChart({ data }: { data: MonthlyCashFlowPoint[] }) {
  const hasData = data.some(
    (point) => point.income > 0 || point.expenses > 0 || point.savings > 0,
  );

  if (!hasData) {
    return (
      <p className="mt-6 text-sm text-ink-soft dark:text-[#cfc2af]">
        Record income or expenses over the past six months to view your cash flow trend.
      </p>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-4 flex flex-wrap items-center gap-5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 bg-[#3d1f0c] dark:bg-[#f7eddd]" />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 bg-[#b85f24]" />
          Expenses
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3.5 bg-[#7a8462]" />
          Savings
        </span>
      </div>

      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="rgba(107,74,44,0.14)" />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6b4a2c" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#6b4a2c" }}
              tickFormatter={formatAxisCurrency}
              width={54}
            />
            <Tooltip content={<TrendTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#3d1f0c"
              fill="#3d1f0c"
              fillOpacity={0.07}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#b85f24"
              fill="#de7b33"
              fillOpacity={0.16}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
            <Area
              type="monotone"
              dataKey="savings"
              name="Savings"
              stroke="#7a8462"
              fill="#7a8462"
              fillOpacity={0.12}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
