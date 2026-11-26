import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-ink/15 pb-6 pt-8 sm:pt-10 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-ember-deep">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl font-bold leading-none sm:text-5xl">{title}</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-ink-soft dark:text-[#cfc2af]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
