"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";

const nav = [
  ["Overview", "/dashboard"],
  ["Expenses", "/expenses"],
  ["Savings", "/savings"],
  ["Goals", "/goals"],
  ["Reports", "/reports"],
  ["Accounts", "/accounts"],
] as const;

const THEME_EVENT = "mybudget-theme-change";

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  return window.localStorage.getItem("mybudget-theme") === "dark";
}

function getServerThemeSnapshot() {
  return false;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  function toggleTheme() {
    window.localStorage.setItem("mybudget-theme", dark ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);

  return (
    <div className="min-h-screen bg-cream text-ink dark:bg-[#17120f] dark:text-[#f7eddd]">
      <header className="sticky top-0 z-40 border-b border-ink/12 bg-cream/95 backdrop-blur dark:border-white/10 dark:bg-[#17120f]/95">
        <Container className="flex h-16 items-center justify-between gap-4 sm:h-18">
          <Link href="/dashboard" className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4">
            <Wordmark className="text-lg sm:text-xl" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {nav.map(([label, href]) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-2 text-[0.67rem] font-bold uppercase tracking-[0.14em] transition-colors ${
                    active
                      ? "border-b-2 border-ember-deep text-ink dark:text-white"
                      : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="grid size-9 place-items-center border border-ink/15 text-sm hover:border-ink/40"
            >
              {dark ? "☀" : "☾"}
            </button>
            <Link
              href="/expenses"
              className="hidden items-center justify-center bg-ember-deep px-4 py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white sm:flex"
            >
              + Add transaction
            </Link>
          </div>
        </Container>
      </header>

      <main className="pb-24 lg:pb-10">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 border border-ink/15 bg-paper/95 px-1 py-1 shadow-lg backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#211b17]/95" aria-label="Mobile navigation">
        {nav.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 flex-col items-center gap-1 py-2 text-[0.5rem] font-bold uppercase tracking-[0.08em] ${pathname === href ? "text-ember-deep" : "text-ink-soft dark:text-[#cfc2af]"}`}
          >
            <span className="text-base">{label === "Overview" ? "◉" : label === "Expenses" ? "↗" : label === "Savings" ? "◎" : label === "Goals" ? "◇" : label === "Reports" ? "▥" : "▤"}</span>
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
