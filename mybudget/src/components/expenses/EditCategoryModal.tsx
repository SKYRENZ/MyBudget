"use client";

import { useEffect, useState } from "react";
import { CategoryColorPicker } from "@/components/expenses/CategoryColorPicker";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { DEFAULT_CATEGORY_COLOR, normalizeHexColor } from "@/lib/category-colors";
import { toDisplayAmount, toStoredUsd } from "@/lib/currency";
import type { Category } from "@/lib/database-types";

type Props = {
  category: Category;
  onClose: () => void;
  onSaved: () => void;
};

export function EditCategoryModal({ category, onClose, onSaved }: Props) {
  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon ?? "");
  const [color, setColor] = useState(normalizeHexColor(category.color, DEFAULT_CATEGORY_COLOR));
  const [monthlyBudget, setMonthlyBudget] = useState(
    Number(category.monthly_budget) > 0
      ? toDisplayAmount(Number(category.monthly_budget)).toFixed(2)
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSave() {
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    const numericBudget = Number(monthlyBudget);
    if (monthlyBudget.trim() !== "" && (!Number.isFinite(numericBudget) || numericBudget < 0)) {
      setError("Monthly budget must be zero or greater.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.categories.update(category.id, {
        name: name.trim(),
        icon: icon.trim() || null,
        color: normalizeHexColor(color, DEFAULT_CATEGORY_COLOR),
        monthly_budget: monthlyBudget.trim() === "" ? 0 : toStoredUsd(numericBudget),
      });
      onSaved();
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mobile-modal-backdrop fixed inset-x-0 inset-y-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-category-dialog-title"
        className="mobile-modal-panel w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
        style={{ maxHeight: "90dvh" }}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-ink/15 bg-paper px-5 py-4 sm:px-6 dark:border-white/10 dark:bg-[#211b17]">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              Organization
            </p>
            <h2 id="edit-category-dialog-title" className="mt-1 font-display text-2xl font-bold">
              Edit category
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close edit category modal"
            onClick={onClose}
            className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft hover:border-ink hover:text-ink dark:border-white/15 dark:text-[#cfc2af]"
          >
            ×
          </button>
        </div>

        <div className="grid gap-4 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_110px]">
            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                Category name
              </span>
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Food, Utilities, Transport…"
                className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep dark:border-white/15"
              />
            </label>

            <label className="block">
              <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                Icon
              </span>
              <input
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                placeholder="🍽️"
                maxLength={8}
                className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-center text-sm outline-none focus:border-ember-deep dark:border-white/15"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
              Monthly budget
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlyBudget}
              onChange={(event) => setMonthlyBudget(event.target.value)}
              placeholder="0.00"
              className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep dark:border-white/15"
            />
          </label>

          <CategoryColorPicker
            value={color}
            onChange={setColor}
            previewName={name}
            previewIcon={icon}
          />
        </div>

        {error ? (
          <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6 dark:border-white/10">
          <ActionButton onClick={onClose}>Cancel</ActionButton>
          <ActionButton primary onClick={handleSave}>
            {saving ? "Saving…" : "Save changes"}
          </ActionButton>
        </div>
      </section>
    </div>
  );
}
