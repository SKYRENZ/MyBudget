import Link from "next/link";
import type { ReactNode } from "react";

type ButtonProps = {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function Button({ href, children, icon, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2.5 border-2 border-ink bg-ember px-6 py-3.5 text-xs font-bold uppercase tracking-[0.22em] text-paper shadow-[5px_5px_0_0_var(--color-ink)] transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[7px_7px_0_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep active:translate-x-0 active:translate-y-0 active:shadow-[3px_3px_0_0_var(--color-ink)] sm:px-8 sm:py-4 sm:text-sm ${className}`}
    >
      {icon ? (
        <span aria-hidden="true" className="shrink-0">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </Link>
  );
}
