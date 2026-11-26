"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import type { ExpenseCategory } from "@/lib/budget";
import { formatCurrency } from "@/lib/currency";

type ExpenseFormProps = {
  mode: "add" | "edit";
  categories: ExpenseCategory[];
  initialCategory: string;
  initialAmount: number;
  onSubmit: (category: string, amount: number) => void;
  onCancel: () => void;
};

const fieldClass =
  "w-full border border-ink/25 bg-paper px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-ink focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ember-deep";
const labelClass =
  "text-[0.6rem] font-bold uppercase tracking-[0.2em] text-ink-soft";
const saveClass =
  "border-2 border-ink bg-ember px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-paper shadow-[3px_3px_0_0_var(--color-ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-ink)]";
const cancelClass =
  "border border-ink/25 px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.18em] text-ink-soft transition-colors hover:border-ink hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep";

export function ExpenseForm({
  mode,
  categories,
  initialCategory,
  initialAmount,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [category, setCategory] = useState(initialCategory);
  const [amount, setAmount] = useState(
    mode === "edit" ? String(initialAmount) : "",
  );
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    amountRef.current?.focus();
    amountRef.current?.select();
  }, []);

  const budget = categories.find((entry) => entry.name === category)?.budget;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = Number(amount);

    if (!Number.isFinite(value) || value < 0) return;

    onSubmit(category, value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="mb-5 border border-ink/20 bg-cream p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-ink">
          {mode === "add" ? "New expense" : "Edit expense"}
        </p>
        {mode === "edit" ? (
          <p className="text-[0.7rem] text-ink-soft">
            {category}
            {budget !== undefined ? ` · ${formatCurrency(budget)} budget` : ""}
          </p>
        ) : null}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {mode === "add" ? (
          <label className="flex flex-col gap-1.5">
            <span className={labelClass}>Category</span>
            <select
              value={category}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setCategory(event.target.value)
              }
              className={fieldClass}
            >
              {categories.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>
            {mode === "edit" ? "Spent so far" : "Amount"}
          </span>
          <input
            ref={amountRef}
            type="number"
            inputMode="decimal"
            min={mode === "add" ? 1 : 0}
            step={1}
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0"
            className={fieldClass}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2">
        <button type="submit" className={saveClass}>
          {mode === "add" ? "Save expense" : "Save changes"}
        </button>
        <button type="button" onClick={onCancel} className={cancelClass}>
          Cancel
        </button>
        <p className="text-[0.65rem] leading-snug text-ink-soft/80">
          {mode === "add"
            ? "Adds to this month’s spending."
            : "Sets the total spent in this category."}
        </p>
      </div>
    </form>
  );
}
