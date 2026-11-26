"use client";

import { useState } from "react";
import { ExpenseForm } from "@/components/dashboard/ExpenseForm";
import { PencilIcon } from "@/components/icons/PencilIcon";
import { PlusIcon } from "@/components/icons/PlusIcon";
import { Panel } from "@/components/ui/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { BudgetMonth, MonthTotals } from "@/lib/budget";
import { formatCurrency } from "@/lib/currency";

type EditorState =
  | { mode: "add" }
  | { mode: "edit"; category: string }
  | null;

type ExpensePanelProps = {
  month: BudgetMonth;
  totals: MonthTotals;
  onAdd: (category: string, amount: number) => void;
  onEdit: (category: string, amount: number) => void;
  className?: string;
};

const addButtonClass =
  "inline-flex items-center gap-1.5 border-2 border-ink bg-ember px-3 py-1.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-paper shadow-[3px_3px_0_0_var(--color-ink)] transition-[transform,box-shadow] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--color-ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember-deep active:translate-x-0 active:translate-y-0 active:shadow-[2px_2px_0_0_var(--color-ink)]";

export function ExpensePanel({
  month,
  totals,
  onAdd,
  onEdit,
  className = "",
}: ExpensePanelProps) {
  const [editor, setEditor] = useState<EditorState>(null);

  const editingCategory =
    editor?.mode === "edit"
      ? month.categories.find((category) => category.name === editor.category)
      : undefined;

  const defaultCategory = month.categories[0].name;

  return (
    <Panel
      title="Where it went"
      eyebrow="Expenses"
      className={className}
      action={
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {formatCurrency(totals.spent)} of {formatCurrency(totals.budget)}
          </p>
          <button
            type="button"
            onClick={() => setEditor({ mode: "add" })}
            className={addButtonClass}
          >
            <PlusIcon className="h-3 w-3" />
            Add expense
          </button>
        </div>
      }
    >
      {editor ? (
        <ExpenseForm
          key={
            editor.mode === "edit" ? `edit-${editor.category}` : "add-expense"
          }
          mode={editor.mode}
          categories={month.categories}
          initialCategory={editingCategory?.name ?? defaultCategory}
          initialAmount={editingCategory?.spent ?? 0}
          onCancel={() => setEditor(null)}
          onSubmit={(category, amount) => {
            if (editor.mode === "add") {
              onAdd(category, amount);
            } else {
              onEdit(category, amount);
            }

            setEditor(null);
          }}
        />
      ) : null}

      <ul className="flex flex-col gap-4">
        {month.categories.map((category) => {
          const over = category.spent > category.budget;
          const isEditing =
            editor?.mode === "edit" && editor.category === category.name;

          return (
            <li key={category.name}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-sm font-semibold text-ink">
                  {category.name}
                </span>

                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-xs tabular-nums text-ink-soft sm:text-[0.8rem]">
                    <span
                      className={
                        over ? "font-semibold text-ember-deep" : "text-ink"
                      }
                    >
                      {formatCurrency(category.spent)}
                    </span>
                    <span className="text-ink-soft/70">
                      {" "}
                      / {formatCurrency(category.budget)}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditor({ mode: "edit", category: category.name })
                    }
                    aria-label={`Edit ${category.name} spending`}
                    aria-expanded={isEditing}
                    className={`-mr-1 ml-0.5 shrink-0 p-1 transition-colors hover:text-ember-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-deep ${
                      isEditing ? "text-ember-deep" : "text-ink-soft/60"
                    }`}
                  >
                    <PencilIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <ProgressBar
                className="mt-2"
                label={`${category.name} spending`}
                value={category.spent}
                max={category.budget}
                tone={over ? "over" : "ember"}
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex items-baseline justify-between gap-3 border-t border-ink/15 pt-4">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-ink">
          Total spent
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {formatCurrency(totals.spent)}
        </span>
      </div>
    </Panel>
  );
}
