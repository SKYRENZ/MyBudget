"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EDITORIAL_PALETTE } from "@/components/reports/chart-utils";
import { formatCurrency } from "@/lib/currency";
import { useSectionHidden } from "@/lib/privacy-preferences";

export type ExpenseSlice = {
  name: string;
  value: number;
  percent: number;
};

type TooltipPayloadItem = {
  payload?: ExpenseSlice;
};

function BreakdownTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) {
  if (!active || !payload?.length) return null;
  const slice = payload[0]?.payload;
  if (!slice) return null;

  return (
    <div className="border border-ink/20 bg-paper px-3 py-2 text-xs shadow-sm dark:border-white/15 dark:bg-[#211b17]">
      <p className="font-semibold text-ink dark:text-[#f7eddd]">{slice.name}</p>
      <p className="mt-1 tabular-nums text-ink-soft dark:text-[#cfc2af]">
        {formatCurrency(slice.value, "reports")} · {slice.percent}%
      </p>
    </div>
  );
}

export function ExpenseBreakdownChart({ data }: { data: ExpenseSlice[] }) {
  useSectionHidden("reports");
  if (!data.length) {
    return (
      <p className="mt-5 text-sm text-ink-soft dark:text-[#cfc2af]">
        No expense categories recorded yet.
      </p>
    );
  }

  return (
    <div className="mt-4 grid items-center gap-5 sm:grid-cols-[200px_1fr]">
      <div className="mx-auto h-48 w-48 sm:mx-0 sm:h-52 sm:w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="56%"
              outerRadius="86%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((slice, index) => (
                <Cell
                  key={slice.name}
                  fill={EDITORIAL_PALETTE[index % EDITORIAL_PALETTE.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<BreakdownTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-2.5">
        {data.map((slice, index) => (
          <li key={slice.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="inline-block size-2.5 shrink-0"
                style={{ backgroundColor: EDITORIAL_PALETTE[index % EDITORIAL_PALETTE.length] }}
              />
              <span className="truncate font-medium">{slice.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-ink-soft dark:text-[#cfc2af]">
              {slice.percent}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
