"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { BudgetTutorial, triggerTutorialReplay } from "@/components/tutorial/BudgetTutorial";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { api, clearLegacyAuthStorage } from "@/lib/api";
import {
  updateBudgetBehavior,
  updateDateFormat,
  updateDefaultCategorySort,
  updateDefaultPageSize,
  updateDefaultSort,
  updateExpenseLayout,
} from "@/lib/app-preferences";
import { getCurrencySnapshot, getServerCurrencySnapshot, subscribeCurrencySettings } from "@/lib/currency";
import {
  getAutoHideOnStartup,
  toggleHideAmounts,
  updateAutoHideOnStartup,
  updateDefaultAmountVisibility,
  updateHideAmounts,
  updatePrivacyConfig,
  useHideAmounts,
} from "@/lib/privacy-preferences";
import {
  getServerTransactionDisplaySnapshot,
  getTransactionDisplaySnapshot,
  subscribeTransactionDisplayMode,
  updateCategoryIndicatorStyle,
  updateTransactionDisplayMode,
  updateTransactionInteraction,
} from "@/lib/transaction-preferences";

const nav = [
  ["Overview", "/dashboard"],
  ["Expenses", "/expenses"],
  ["Planning", "/savings"],
  ["Reports", "/reports"],
  ["Accounts", "/accounts"],
] as const;

const THEME_EVENT = "mybudget-theme-change";
let hasHydratedPrivacy = false;

function subscribeToTheme(callback: () => void) {
  window.addEventListener(THEME_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(THEME_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot() {
  const stored = window.localStorage.getItem("mybudget-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  // "system" — follow OS preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerThemeSnapshot() {
  return false;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const dark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);
  const hideAmounts = useHideAmounts();
  useSyncExternalStore(subscribeCurrencySettings, getCurrencySnapshot, getServerCurrencySnapshot);
  useSyncExternalStore(
    subscribeTransactionDisplayMode,
    getTransactionDisplaySnapshot,
    getServerTransactionDisplaySnapshot,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ id: string; username: string } | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function openSettings() {
    setSettingsOpen(true);
    api.auth
      .session()
      .then((res) => setSessionUser(res.authenticated ? res.user : null))
      .catch(() => setSessionUser(null));
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await api.auth.logout();
      clearLegacyAuthStorage();
      setSessionUser(null);
      setSettingsOpen(false);
      router.replace("/auth");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  function toggleTheme() {
    // If currently dark, switch to light; otherwise switch to dark.
    window.localStorage.setItem("mybudget-theme", dark ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function handleToggleVisibility() {
    hasHydratedPrivacy = true;
    const next = toggleHideAmounts();
    void api.profile.update({ hide_amounts: next }).catch(() => {});
  }

  function handleExportCsv() {
    // Trigger CSV export via the reports page download mechanism
    const link = document.createElement("a");
    link.href = "/api/transactions/export?format=csv";
    link.download = "mybudget-transactions.csv";
    link.click();
  }

  useEffect(() => {
    if (pathname === "/" || pathname === "/auth") return;
    let cancelled = false;
    api.auth
      .session()
      .then((res) => {
        if (cancelled) return;
        if (!res.authenticated) {
          clearLegacyAuthStorage();
          router.replace("/auth");
        } else {
          setSessionUser(res.user);
          api.preferences
            .get()
            .then(({ preferences }) => {
              if (cancelled || !preferences) return;
              if (preferences.expenseLayout) updateExpenseLayout(preferences.expenseLayout);
              if (preferences.transactionDisplay)
                updateTransactionDisplayMode(preferences.transactionDisplay);
              if (preferences.categoryIndicatorStyle)
                updateCategoryIndicatorStyle(preferences.categoryIndicatorStyle);
              if (preferences.dateFormat) updateDateFormat(preferences.dateFormat);
              if (preferences.budgetBehavior) updateBudgetBehavior(preferences.budgetBehavior);
              if (preferences.pageSize) updateDefaultPageSize(preferences.pageSize);
              if (preferences.defaultSort) updateDefaultSort(preferences.defaultSort);
              if (preferences.defaultCategorySort)
                updateDefaultCategorySort(preferences.defaultCategorySort);
              if (preferences.defaultAmountVisibility)
                updateDefaultAmountVisibility(preferences.defaultAmountVisibility);
              if (typeof preferences.autoHideOnStartup === "boolean")
                updateAutoHideOnStartup(preferences.autoHideOnStartup);
              if (preferences.transactionInteraction)
                updateTransactionInteraction(preferences.transactionInteraction);

              const autoHide =
                typeof preferences.autoHideOnStartup === "boolean"
                  ? preferences.autoHideOnStartup
                  : getAutoHideOnStartup();

              if (!hasHydratedPrivacy) {
                hasHydratedPrivacy = true;
                api.profile
                  .get()
                  .then((profile) => {
                    if (cancelled) return;
                    updatePrivacyConfig({
                      ...(typeof profile.hide_dashboard === "boolean"
                        ? { hide_dashboard: profile.hide_dashboard }
                        : {}),
                      ...(typeof profile.hide_category_budgets === "boolean"
                        ? { hide_category_budgets: profile.hide_category_budgets }
                        : {}),
                      ...(typeof profile.hide_transactions === "boolean"
                        ? { hide_transactions: profile.hide_transactions }
                        : {}),
                      ...(typeof profile.hide_accounts === "boolean"
                        ? { hide_accounts: profile.hide_accounts }
                        : {}),
                      ...(typeof profile.hide_goals_savings === "boolean"
                        ? { hide_goals_savings: profile.hide_goals_savings }
                        : {}),
                      ...(typeof profile.hide_reports === "boolean"
                        ? { hide_reports: profile.hide_reports }
                        : {}),
                    });

                    if (autoHide) {
                      updateHideAmounts(true);
                    } else if (typeof profile.hide_amounts === "boolean") {
                      updateHideAmounts(profile.hide_amounts);
                    } else if (preferences.defaultAmountVisibility) {
                      updateHideAmounts(preferences.defaultAmountVisibility === "hide");
                    }
                  })
                  .catch(() => {
                    if (autoHide) updateHideAmounts(true);
                  });
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);


  if (pathname === "/" || pathname === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-cream text-ink dark:bg-[#17120f] dark:text-[#f7eddd]">
      <header className="sticky top-0 z-40 border-b border-ink/12 bg-cream/95 backdrop-blur dark:border-white/10 dark:bg-[#17120f]/95">
        <Container className="flex h-16 items-center justify-between gap-4 sm:h-18">
          <Link href="/dashboard" className="shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4">
            <Wordmark className="text-lg sm:text-xl" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
            {nav.map(([label, href]) => {
              const active = pathname === href || (href === "/savings" && pathname === "/recurring");
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
              onClick={triggerTutorialReplay}
              aria-label="Open tutorial"
              title="Setup tutorial"
              className="grid size-9 place-items-center border border-ink/15 text-xs font-bold hover:border-ink/40 dark:border-white/15 dark:hover:border-white/35"
            >
              ?
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="grid size-9 place-items-center border border-ink/15 text-sm hover:border-ink/40 dark:border-white/15 dark:hover:border-white/35"
            >
              {dark ? "☀" : "☾"}
            </button>
            <button
              type="button"
              onClick={handleToggleVisibility}
              aria-label={hideAmounts ? "Show amounts" : "Hide amounts"}
              title={hideAmounts ? "Show amounts" : "Hide amounts"}
              aria-pressed={hideAmounts}
              className={`grid size-9 place-items-center border transition-colors ${
                hideAmounts
                  ? "border-ember-deep bg-ember-deep/10 text-ember-deep"
                  : "border-ink/15 hover:border-ink/40 dark:border-white/15 dark:hover:border-white/35"
              }`}
            >
              {hideAmounts ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                  <path d="m2 2 20 20" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4"
                  aria-hidden="true"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={openSettings}
              aria-label="Open settings"
              className="grid size-9 place-items-center border border-ink/15 text-sm hover:border-ink/40 dark:border-white/15 dark:hover:border-white/35"
            >
              ⚙
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

      <main className="pb-[calc(6rem+var(--keyboard-inset,0px))] lg:pb-[calc(2.5rem+var(--keyboard-inset,0px))]">{children}</main>

      <nav className="mobile-bottom-nav fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 border border-ink/15 bg-paper/95 px-1 py-1 shadow-lg backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#211b17]/95" aria-label="Mobile navigation">
        {nav.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 flex-col items-center gap-1 py-2 text-[0.5rem] font-bold uppercase tracking-[0.08em] ${pathname === href || (href === "/savings" && pathname === "/recurring") ? "text-ember-deep" : "text-ink-soft dark:text-[#cfc2af]"}`}
          >
            <span className="text-base">{label === "Overview" ? "◉" : label === "Expenses" ? "↗" : label === "Planning" ? "◎" : label === "Reports" ? "▥" : "▤"}</span>
            {label}
          </Link>
        ))}
      </nav>

      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sessionUser={sessionUser}
        loggingOut={loggingOut}
        onLogout={handleLogout}
        onTutorial={() => {
          setSettingsOpen(false);
          triggerTutorialReplay();
        }}
        onExportCsv={handleExportCsv}
      />

      <BudgetTutorial />
    </div>
  );
}
