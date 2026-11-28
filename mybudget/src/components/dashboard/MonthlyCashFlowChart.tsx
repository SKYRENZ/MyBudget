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
import { useSectionHidden, type PrivacySection } from "@/lib/privacy-preferences";

export type DailyCashFlowPoint = {
  day: string;
  label: string;
  income: number;
  expenses: number;
};

type TooltipPayloadItem = {
  dataKey?: string;
  name?: string;
  value?: number;
  color?: string;
  payload?: DailyCashFlowPoint;
};

function CashFlowTooltip({
  active,
  payload,
  privacySection,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  privacySection: PrivacySection;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;

  return (
    <div className="border border-ink/20 bg-paper px-3 py-2 text-xs shadow-sm dark:border-white/15 dark:bg-[#211b17]">
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
        {point?.label}
      </p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink-soft dark:text-[#cfc2af]">
              <span
                className="inline-block size-2"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-semibold tabular-nums text-ink dark:text-[#f7eddd]">
              {formatCurrency(Number(entry.value ?? 0), privacySection)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MonthlyCashFlowChart({
  data,
  privacySection = "dashboard",
}: {
  data: DailyCashFlowPoint[];
  privacySection?: PrivacySection;
}) {
  const hideAmounts = useSectionHidden(privacySection);
  const hasMovement = data.some((point) => point.income > 0 || point.expenses > 0);

  if (!hasMovement) {
    return (
      <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
        No daily income or expense movement recorded for this month yet.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[#7a8462]" />
          Income
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-3 bg-[#b85f24]" />
          Expenses
        </span>
      </div>
      <div className="h-52 w-full sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 3" vertical={false} stroke="rgba(107,74,44,0.14)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6b4a2c" }}
              interval="preserveStartEnd"
              minTickGap={22}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6b4a2c" }}
              tickFormatter={(value) => (hideAmounts ? "••••" : formatAxisCurrency(value, privacySection))}
              width={52}
            />
            <Tooltip content={<CashFlowTooltip privacySection={privacySection} />} />
            <Area
              type="monotone"
              dataKey="income"
              name="Income"
              stroke="#7a8462"
              fill="#7a8462"
              fillOpacity={0.1}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3.5 }}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#b85f24"
              fill="#de7b33"
              fillOpacity={0.14}
              strokeWidth={1.75}
              dot={false}
              activeDot={{ r: 3.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
