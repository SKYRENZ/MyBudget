import type { ReactNode } from "react";

export function ActionButton({
  children,
  primary = false,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  primary?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`border px-3 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em] transition-colors sm:px-4 ${
        primary
          ? "border-ember-deep bg-ember-deep text-white hover:bg-[#9f4e1d]"
          : "border-ink/15 bg-paper text-ink hover:border-ink/40 dark:border-white/10 dark:bg-[#211b17] dark:text-white"
      }`}
    >
      {children}
    </button>
  );
}
