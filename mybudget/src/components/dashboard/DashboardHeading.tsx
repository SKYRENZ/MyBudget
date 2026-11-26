import { Eyebrow } from "@/components/ui/Eyebrow";

type DashboardHeadingProps = {
  monthLabel: string;
  updated: string;
};

export function DashboardHeading({ monthLabel, updated }: DashboardHeadingProps) {
  return (
    <div className="flex flex-col gap-4 pb-8 pt-10 sm:pb-10 sm:pt-12 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <Eyebrow>Overview</Eyebrow>
        <h1 className="mt-3 max-w-[18ch] font-display text-[clamp(2rem,5vw,3.4rem)] font-black leading-[1.02] text-ink">
          Your month, at a glance.
        </h1>
        <p className="mt-3 max-w-[52ch] text-sm leading-relaxed text-ink-soft sm:text-base">
          Income, spending and savings for {monthLabel.toLowerCase()} — every
          figure below moves as the month goes on.
        </p>
      </div>

      <p className="shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-ink-soft/80">
        {updated}
      </p>
    </div>
  );
}
