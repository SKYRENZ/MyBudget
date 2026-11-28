"use client";

import { useState, useSyncExternalStore } from "react";
import { Check } from "lucide-react";
import {
  CATEGORY_COLOR_PRESETS,
  DEFAULT_CATEGORY_COLOR,
  isValidHexColor,
  normalizeHexColor,
} from "@/lib/category-colors";
import {
  getCategoryIndicatorStyleSnapshot,
  getServerCategoryIndicatorStyleSnapshot,
  subscribeCategoryIndicatorStyle,
} from "@/lib/transaction-preferences";

type Props = {
  value: string;
  onChange: (hex: string) => void;
  previewName?: string;
  previewIcon?: string;
};

export function CategoryColorPicker({
  value,
  onChange,
  previewName = "Food",
  previewIcon = "",
}: Props) {
  const indicatorStyle = useSyncExternalStore(
    subscribeCategoryIndicatorStyle,
    getCategoryIndicatorStyleSnapshot,
    getServerCategoryIndicatorStyleSnapshot,
  );
  const [hexInput, setHexInput] = useState(value);
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setHexInput(value);
  }

  const normalized = normalizeHexColor(value, DEFAULT_CATEGORY_COLOR);
  const showBar = indicatorStyle === "bar_dot" || indicatorStyle === "bar";
  const showDot = indicatorStyle === "bar_dot" || indicatorStyle === "dot";

  function handleHexTextChange(raw: string) {
    setHexInput(raw);
    const candidate = raw.startsWith("#") ? raw : `#${raw}`;
    if (isValidHexColor(candidate)) {
      onChange(candidate.toUpperCase());
    }
  }

  function handleHexBlur() {
    setHexInput(normalized);
  }

  return (
    <div className="space-y-4">
      {/* Preset Color Palette */}
      <div>
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Color
        </span>
        <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-9">
          {CATEGORY_COLOR_PRESETS.map((preset) => {
            const selected = normalized.toUpperCase() === preset.hex.toUpperCase();
            return (
              <button
                key={preset.hex}
                type="button"
                title={`${preset.name} (${preset.hex})`}
                aria-label={`${preset.name} ${preset.hex}`}
                aria-pressed={selected}
                onClick={() => onChange(preset.hex)}
                className={`group flex flex-col items-center gap-1 border p-1.5 transition-colors ${
                  selected
                    ? "border-ink bg-ink/5 dark:border-[#f7eddd] dark:bg-white/10"
                    : "border-ink/12 hover:border-ink/35 dark:border-white/10 dark:hover:border-white/30"
                }`}
              >
                <span
                  className="grid size-6 place-items-center rounded-full border border-black/10 text-white"
                  style={{ backgroundColor: preset.hex }}
                >
                  {selected && <Check className="size-3.5" strokeWidth={2.75} aria-hidden="true" />}
                </span>
                <span className="text-[0.55rem] font-semibold tracking-tight text-ink-soft dark:text-[#cfc2af]">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Color Picker + HEX Input */}
      <div className="flex flex-wrap items-center gap-3 border border-ink/12 bg-cream/40 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.02]">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="color"
            value={normalized}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
            aria-label="Custom color picker"
            className="size-8 cursor-pointer border border-ink/20 bg-transparent p-0.5 dark:border-white/20"
          />
          <span className="text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-soft dark:text-[#cfc2af]">
            Custom
          </span>
        </label>

        <div className="flex flex-1 items-center border border-ink/15 bg-paper px-2.5 py-1.5 focus-within:border-ember-deep dark:border-white/15 dark:bg-[#211b17]">
          <span className="mr-1.5 text-[0.6rem] font-bold uppercase tracking-[0.12em] text-ink-soft dark:text-[#cfc2af]">
            HEX
          </span>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexTextChange(e.target.value)}
            onBlur={handleHexBlur}
            maxLength={7}
            placeholder="#D97706"
            aria-label="HEX color code"
            className="w-full min-w-[80px] bg-transparent font-mono text-xs uppercase outline-none"
          />
          <span
            className="ml-2 size-4 shrink-0 rounded-full border border-black/15"
            style={{ backgroundColor: normalized }}
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
            Live Preview
          </span>
          <span className="text-[0.58rem] text-ink-soft/80 dark:text-[#cfc2af]/70">
            Transaction list appearance
          </span>
        </div>

        <div className="mt-2 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
          <div
            className="flex items-center justify-between gap-3 px-4 py-3"
            style={showBar ? { borderLeft: `3px solid ${normalized}` } : undefined}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Lunch &amp; Coffee</p>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-ink-soft dark:text-[#cfc2af]">
                {showDot && (
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: normalized }}
                    aria-hidden="true"
                  />
                )}
                <span>
                  {previewIcon ? `${previewIcon} ` : ""}
                  {previewName.trim() || "Category"} · Wallet · 2026-11-28
                </span>
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold tabular-nums text-ember-deep">
              −₱423.00
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
