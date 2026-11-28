"use client";

import { useState } from "react";

const THEME_EVENT = "mybudget-theme-change";
const THEME_KEY = "mybudget-theme";

type ThemeChoice = "light" | "dark" | "system";

function getCurrentTheme(): ThemeChoice {
  if (typeof window === "undefined") return "system";
  const stored = window.localStorage.getItem(THEME_KEY);
  if (stored === "dark") return "dark";
  if (stored === "light") return "light";
  return "system";
}

export function DisplaySettings() {
  const [theme, setTheme] = useState<ThemeChoice>(() => getCurrentTheme());

  function applyTheme(choice: ThemeChoice) {
    setTheme(choice);
    if (choice === "system") {
      window.localStorage.removeItem(THEME_KEY);
    } else {
      window.localStorage.setItem(THEME_KEY, choice);
    }
    // Dispatch the shared theme event — AppShell's useSyncExternalStore picks it up
    // and applies classList / colorScheme via its own useEffect.
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  return (
    <div className="grid gap-6">
      {/* Theme */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Appearance
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Theme</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Choose how MyBudget looks. System follows your device preference.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Theme</legend>
          <div className="grid grid-cols-3 border border-ink/15 dark:border-white/10">
            {(["light", "dark", "system"] as ThemeChoice[]).map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => applyTheme(t)}
                className={`flex flex-col items-center gap-1.5 py-3 text-xs font-bold capitalize transition-colors ${i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""} ${
                  theme === t
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                <span className="text-base">
                  {t === "light" ? "☀" : t === "dark" ? "☾" : "◑"}
                </span>
                {t}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      {/* Compact Mode (placeholder) */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Layout
        </p>
        <div className="mt-2 flex items-center justify-between border border-ink/15 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold dark:text-[#f7eddd]">Compact Mode</p>
            <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
              Reduce spacing for a denser layout
            </p>
          </div>
          <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            Soon
          </span>
        </div>
      </section>

      {/* Font Scale (placeholder) */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Typography
        </p>
        <div className="mt-2 flex items-center justify-between border border-ink/15 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold dark:text-[#f7eddd]">Font Scale</p>
            <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
              Adjust text size globally
            </p>
          </div>
          <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            Soon
          </span>
        </div>
      </section>
    </div>
  );
}
