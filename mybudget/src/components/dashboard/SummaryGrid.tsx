import type { SummaryStat } from "@/lib/budget";
import { StatCard } from "@/components/dashboard/StatCard";

export function SummaryGrid({ stats }: { stats: SummaryStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
