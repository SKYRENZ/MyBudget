"use client";

import { useState, useSyncExternalStore } from "react";
import { api } from "@/lib/api";
import {
  CATEGORY_INDICATOR_OPTIONS,
  getCategoryIndicatorStyleSnapshot,
  getServerCategoryIndicatorStyleSnapshot,
  subscribeCategoryIndicatorStyle,
  updateCategoryIndicatorStyle,
  type CategoryIndicatorStyle,
} from "@/lib/transaction-preferences";
import {
  getAutoHideOnStartupSnapshot,
  getDefaultAmountVisibilitySnapshot,
  getServerAutoHideOnStartupSnapshot,
  getServerDefaultAmountVisibilitySnapshot,
  PRIVACY_SECTION_OPTIONS,
  subscribeAutoHideOnStartup,
  subscribeDefaultAmountVisibility,
  updateAutoHideOnStartup,
  updateDefaultAmountVisibility,
  updateHideAmounts,
  updatePrivacyConfig,
  usePrivacyConfig,
  type DefaultAmountVisibility,
  type PrivacyConfig,
} from "@/lib/privacy-preferences";

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

  const defaultVisibility = useSyncExternalStore(
    subscribeDefaultAmountVisibility,
    getDefaultAmountVisibilitySnapshot,
    getServerDefaultAmountVisibilitySnapshot,
  );
  const autoHideOnStartup = useSyncExternalStore(
    subscribeAutoHideOnStartup,
    getAutoHideOnStartupSnapshot,
    getServerAutoHideOnStartupSnapshot,
  );
  const categoryIndicatorStyle = useSyncExternalStore(
    subscribeCategoryIndicatorStyle,
    getCategoryIndicatorStyleSnapshot,
    getServerCategoryIndicatorStyleSnapshot,
  );
  const privacyConfig = usePrivacyConfig();

  function handleIndicatorStyleChange(style: CategoryIndicatorStyle) {
    updateCategoryIndicatorStyle(style);
    void api.preferences.update({ categoryIndicatorStyle: style }).catch(() => {});
  }

  function handleSectionToggle(key: keyof PrivacyConfig, checked: boolean) {
    updatePrivacyConfig({ [key]: checked });
    void api.profile.update({ [key]: checked }).catch(() => {});
  }

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

  function handleDefaultVisibilityChange(mode: DefaultAmountVisibility) {
    updateDefaultAmountVisibility(mode);
    updateHideAmounts(mode === "hide");
    void api.preferences.update({ defaultAmountVisibility: mode }).catch(() => {});
    void api.profile.update({ hide_amounts: mode === "hide" }).catch(() => {});
  }

  function handleAutoHideChange(enabled: boolean) {
    updateAutoHideOnStartup(enabled);
    void api.preferences.update({ autoHideOnStartup: enabled }).catch(() => {});
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

      {/* Privacy */}
      <section className="border-t border-ink/15 pt-5 dark:border-white/10">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Privacy
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Default Amount Visibility</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          Hide all monetary values across MyBudget while keeping transactions, categories, and
          navigation visible.
        </p>

        <fieldset className="mt-3">
          <legend className="sr-only">Default Amount Visibility</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {(
              [
                { value: "show", label: "Show Amounts" },
                { value: "hide", label: "Hide Amounts" },
              ] as const
            ).map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleDefaultVisibilityChange(opt.value)}
                className={`py-3 text-xs font-bold transition-colors sm:text-sm ${
                  i > 0 ? "border-l border-ink/15 dark:border-white/10" : ""
                } ${
                  defaultVisibility === opt.value
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-3 flex cursor-pointer items-center justify-between gap-3 border border-ink/15 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold dark:text-[#f7eddd]">Auto Hide On Startup</p>
            <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
              Automatically mask amounts each time you open MyBudget
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoHideOnStartup}
            onChange={(e) => handleAutoHideChange(e.target.checked)}
            className="size-4 accent-[#b85f24]"
          />
        </label>

        {/* Privacy Mode Configuration */}
        <div className="mt-5">
          <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
            Privacy Mode Configuration
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
            Choose which financial information should be hidden when Privacy Mode is enabled.
          </p>
          <div className="mt-3 divide-y divide-ink/10 border border-ink/15 dark:divide-white/8 dark:border-white/10">
            {PRIVACY_SECTION_OPTIONS.map(({ key, label }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-cream/40 dark:hover:bg-white/[0.03]"
              >
                <span className="text-sm font-medium dark:text-[#f7eddd]">{label}</span>
                <input
                  type="checkbox"
                  checked={privacyConfig[key]}
                  onChange={(e) => handleSectionToggle(key, e.target.checked)}
                  className="size-4 accent-[#b85f24]"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Transactions — Category Indicator Style */}
      <section className="border-t border-ink/15 pt-5 dark:border-white/10">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Transactions
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Category Indicator Style</h3>
        <p className="mt-1 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
          Choose how category colors appear in your transaction lists.
        </p>

        <fieldset className="mt-3">
          <legend className="sr-only">Category Indicator Style</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            {CATEGORY_INDICATOR_OPTIONS.map((opt, idx) => {
              const active = categoryIndicatorStyle === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleIndicatorStyleChange(opt.value)}
                  className={`flex flex-col items-start gap-1 p-3 text-left transition-colors ${
                    idx % 2 === 1 ? "border-l border-ink/15 dark:border-white/10" : ""
                  } ${idx >= 2 ? "border-t border-ink/15 dark:border-white/10" : ""} ${
                    active
                      ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                      : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                  }`}
                >
                  <span className="text-xs font-bold">{opt.label}</span>
                  <span
                    className={`text-[0.65rem] leading-snug ${
                      active ? "opacity-80" : "text-ink-soft/80 dark:text-[#cfc2af]/75"
                    }`}
                  >
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>

      {/* Compact Mode (placeholder) */}
      <section className="border-t border-ink/15 pt-5 dark:border-white/10">
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
