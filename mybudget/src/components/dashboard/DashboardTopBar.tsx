import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";

type DashboardTopBarProps = {
  monthLabel: string;
};

export function DashboardTopBar({ monthLabel }: DashboardTopBarProps) {
  return (
    <header className="border-b border-ink/15">
      <Container className="flex items-center justify-between gap-4 py-4 sm:py-5">
        <Link
          href="/"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep"
        >
          <Wordmark className="text-lg text-ink sm:text-xl" />
          <span className="sr-only">MyBudget home</span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <p className="hidden text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-ink-soft sm:block">
            {monthLabel}
          </p>
          <Link
            href="/"
            className="border border-ink/25 px-3 py-2 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-soft transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep sm:px-4 sm:text-[0.65rem]"
          >
            Home
          </Link>
        </div>
      </Container>
    </header>
  );
}
