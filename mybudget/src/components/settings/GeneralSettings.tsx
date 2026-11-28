"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  getCurrencySettings,
  updateCurrencySettings,
  type CurrencyCode,
} from "@/lib/currency";
import {
  getDateFormat,
  updateDateFormat,
  type DateFormat,
} from "@/lib/app-preferences";

export function GeneralSettings() {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(
    () => getCurrencySettings().code,
  );
  const [usdToPhp, setUsdToPhp] = useState<string>(
    () => String(getCurrencySettings().usdToPhp),
  );
  const [dateFormat, setDateFormat] = useState<DateFormat>(() => getDateFormat());
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const rate = Number(usdToPhp);
    updateCurrencySettings({
      code: currencyCode,
      usdToPhp: Number.isFinite(rate) && rate > 0 ? rate : 56,
    });
    updateDateFormat(dateFormat);
    void api.preferences.update({ dateFormat }).catch(() => {});
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <div className="grid gap-6">
      {/* Currency */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Currency
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Display Currency</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Choose the currency used throughout the app.
        </p>
        <fieldset className="mt-3">
          <legend className="sr-only">Display currency</legend>
          <div className="grid grid-cols-2 border border-ink/15 dark:border-white/10">
            <button
              type="button"
              onClick={() => setCurrencyCode("USD")}
              className={`py-3 text-sm font-bold transition-colors ${
                currencyCode === "USD"
                  ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                  : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
              }`}
            >
              US Dollar · USD
            </button>
            <button
              type="button"
              onClick={() => setCurrencyCode("PHP")}
              className={`border-l border-ink/15 py-3 text-sm font-bold transition-colors dark:border-white/10 ${
                currencyCode === "PHP"
                  ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                  : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
              }`}
            >
              Philippine Peso · PHP
            </button>
          </div>
        </fieldset>
      </section>

      {/* Exchange Rate */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Exchange Rate
        </p>
        <label className="mt-2 block">
          <span className="text-sm text-ink-soft dark:text-[#cfc2af]">1 US Dollar equals</span>
          <div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep dark:border-white/10">
            <span className="grid w-14 place-items-center border-r border-ink/15 text-sm text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
              PHP
            </span>
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={usdToPhp}
              onChange={(e) => setUsdToPhp(e.target.value)}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none dark:text-[#f7eddd]"
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-soft dark:text-[#cfc2af]">
            Update this rate manually. It converts stored PHP values for display only.
          </p>
        </label>
      </section>

      {/* Language (placeholder) */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Language
        </p>
        <div className="mt-2 flex items-center justify-between border border-ink/15 px-3.5 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold dark:text-[#f7eddd]">English</p>
            <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
              More languages coming soon
            </p>
          </div>
          <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
            Soon
          </span>
        </div>
      </section>

      {/* Date Format */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Date Format
        </p>
        <fieldset className="mt-2">
          <legend className="sr-only">Date format</legend>
          <div className="grid grid-cols-2 border border-ink/15 sm:grid-cols-4 dark:border-white/10">
            {(
              [
                { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                { value: "MMM D", label: "Nov. 27" },
              ] as { value: DateFormat; label: string }[]
            ).map(({ value, label }, i) => (
              <button
                key={value}
                type="button"
                onClick={() => setDateFormat(value)}
                className={`py-2.5 text-xs font-bold transition-colors ${
                  i > 0 ? "border-t border-ink/15 sm:border-t-0 sm:border-l dark:border-white/10" : ""
                } ${i === 1 ? "border-l border-t-0 dark:border-white/10" : ""} ${
                  i === 3 ? "border-l dark:border-white/10" : ""
                } ${
                  dateFormat === value
                    ? "bg-ink text-paper dark:bg-[#f7eddd] dark:text-[#17120f]"
                    : "text-ink-soft hover:text-ink dark:text-[#cfc2af] dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="mt-2 text-xs text-ink-soft dark:text-[#cfc2af]">
          Controls how dates are displayed across transactions, dashboard, and reports.
        </p>
      </section>

      {/* Save button */}
      <div className="flex justify-end border-t border-ink/15 pt-4 dark:border-white/10">
        <button
          type="button"
          onClick={handleSave}
          className="border border-ember-deep bg-ember-deep px-5 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-white transition-colors hover:bg-ember-deep/90"
        >
          {saved ? "Saved ✓" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
