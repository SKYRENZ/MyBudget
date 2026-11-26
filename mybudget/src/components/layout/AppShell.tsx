"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { Wordmark } from "@/components/ui/Wordmark";
import { getCurrencySettings, getCurrencySnapshot, getServerCurrencySnapshot, subscribeCurrencySettings, updateCurrencySettings, type CurrencyCode } from "@/lib/currency";

const nav = [
  ["Overview", "/dashboard"],
  ["Expenses", "/expenses"],
  ["Planning", "/savings"],
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
  useSyncExternalStore(subscribeCurrencySettings, getCurrencySnapshot, getServerCurrencySnapshot);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>("USD");
  const [usdToPhp, setUsdToPhp] = useState(String(getCurrencySettings().usdToPhp));

  function openSettings() {
    const settings = getCurrencySettings();
    setCurrencyCode(settings.code);
    setUsdToPhp(String(settings.usdToPhp));
    setSettingsOpen(true);
  }

  function toggleTheme() {
    window.localStorage.setItem("mybudget-theme", dark ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function saveCurrencySettings() {
    const rate = Number(usdToPhp);
    updateCurrencySettings({ code: currencyCode, usdToPhp: Number.isFinite(rate) && rate > 0 ? rate : 56 });
    setSettingsOpen(false);
  }

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
  }, [dark]);


  if (pathname === "/" || pathname === "/auth") {
    return <>{children}</>;
  }

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
            <button
              type="button"
              onClick={openSettings}
              aria-label="Open settings"
              className="grid size-9 place-items-center border border-ink/15 text-sm hover:border-ink/40"
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

      <main className="pb-24 lg:pb-10">{children}</main>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-6 border border-ink/15 bg-paper/95 px-1 py-1 shadow-lg backdrop-blur lg:hidden dark:border-white/10 dark:bg-[#211b17]/95" aria-label="Mobile navigation">
        {nav.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={`flex min-w-0 flex-col items-center gap-1 py-2 text-[0.5rem] font-bold uppercase tracking-[0.08em] ${pathname === href ? "text-ember-deep" : "text-ink-soft dark:text-[#cfc2af]"}`}
          >
            <span className="text-base">{label === "Overview" ? "◉" : label === "Expenses" ? "↗" : label === "Planning" ? "◎" : label === "Reports" ? "▥" : "▤"}</span>
            {label}
          </Link>
        ))}
      </nav>

      {settingsOpen ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="settings-dialog-title" className="w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Preferences</p><h2 id="settings-dialog-title" className="mt-1 font-display text-2xl font-bold">Settings</h2></div><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>
            <div className="grid gap-5 p-5 sm:p-6">
              <fieldset><legend className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Display currency</legend><div className="mt-2 grid grid-cols-2 border border-ink/15"><button type="button" onClick={() => setCurrencyCode("USD")} className={`py-3 text-sm font-bold ${currencyCode === "USD" ? "bg-ink text-paper" : "text-ink-soft"}`}>US Dollar · USD</button><button type="button" onClick={() => setCurrencyCode("PHP")} className={`py-3 text-sm font-bold ${currencyCode === "PHP" ? "bg-ink text-paper" : "text-ink-soft"}`}>Philippine Peso · PHP</button></div></fieldset>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">1 US Dollar equals</span><div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep"><span className="grid w-14 place-items-center border-r border-ink/15 text-sm text-ink-soft">PHP</span><input type="number" min="0.0001" step="0.0001" value={usdToPhp} onChange={(event) => setUsdToPhp(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /></div><p className="mt-2 text-xs leading-relaxed text-ink-soft">Update this rate manually. It converts stored USD values for display only.</p></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><button type="button" onClick={() => setSettingsOpen(false)} className="border border-ink/15 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em]">Cancel</button><button type="button" onClick={saveCurrencySettings} className="border border-ember-deep bg-ember-deep px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-white">Save settings</button></div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
