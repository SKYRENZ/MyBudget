import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui/Eyebrow";

type PanelProps = {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

function toHeadingId(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: PanelProps) {
  const headingId = `panel-${toHeadingId(title)}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`flex flex-col border border-ink/15 bg-paper dark:border-white/15 dark:bg-[#211b17] ${className}`}
    >
      <header className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-ink/15 px-5 py-4 sm:px-6 sm:py-5 dark:border-white/10">
        <div className="min-w-0">
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <h2
            id={headingId}
            className="mt-1 font-display text-xl font-bold leading-tight text-ink sm:text-2xl"
          >
            {title}
          </h2>
        </div>
        {action}
      </header>

      <div className="flex-1 px-5 py-5 sm:px-6 sm:py-6">{children}</div>
    </section>
  );
}
