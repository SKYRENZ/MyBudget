"use client";

import { useRef, useState } from "react";
import { formatCurrency } from "@/lib/currency";
import type { Category } from "@/lib/database-types";
import { useHideAmounts, usePrivacyConfig } from "@/lib/privacy-preferences";

type CategoryCustomizeSheetProps = {
  open: boolean;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onCommit: (nextCategories: Category[]) => void;
};

function normalizeOrder(list: Category[]): Category[] {
  const pinned = list.filter((c) => Boolean(c.is_pinned));
  const unpinned = list.filter((c) => !c.is_pinned);
  return [...pinned, ...unpinned].map((cat, idx) => ({
    ...cat,
    sort_order: idx,
    is_pinned: Boolean(cat.is_pinned),
  }));
}

export function CategoryCustomizeSheet({
  open,
  categories,
  saving,
  onClose,
  onCommit,
}: CategoryCustomizeSheetProps) {
  useHideAmounts();
  usePrivacyConfig();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [localOrder, setLocalOrder] = useState<Category[] | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const localOrderRef = useRef<Category[] | null>(null);

  if (!open) return null;

  const items = normalizeOrder(localOrder ?? categories);

  function togglePin(id: string) {
    const base = normalizeOrder(localOrder ?? categories);
    const toggled = base.map((cat) =>
      cat.id === id ? { ...cat, is_pinned: !cat.is_pinned } : cat,
    );
    const next = normalizeOrder(toggled);
    setLocalOrder(null);
    localOrderRef.current = null;
    onCommit(next);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>, id: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const initial = normalizeOrder(categories);
    setDraggingId(id);
    setLocalOrder(initial);
    localOrderRef.current = initial;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    if (!draggingId || !listRef.current || !localOrderRef.current) return;

    const currentList = localOrderRef.current;
    const draggedIndex = currentList.findIndex((c) => c.id === draggingId);
    if (draggedIndex === -1) return;

    const draggedItem = currentList[draggedIndex];
    const rowElements = Array.from(
      listRef.current.querySelectorAll<HTMLElement>("[data-cat-row]"),
    );

    const pointerY = event.clientY;
    let targetIndex = draggedIndex;

    for (let i = 0; i < rowElements.length; i += 1) {
      const rect = rowElements[i].getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const candidateId = rowElements[i].dataset.catRow;
      const candidate = currentList.find((c) => c.id === candidateId);
      // Keep pinned items within pinned group and unpinned within unpinned group
      if (!candidate || Boolean(candidate.is_pinned) !== Boolean(draggedItem.is_pinned)) {
        continue;
      }
      if (i < draggedIndex && pointerY < midY) {
        targetIndex = i;
        break;
      }
      if (i > draggedIndex && pointerY > midY) {
        targetIndex = i;
      }
    }

    if (targetIndex !== draggedIndex) {
      const reordered = [...currentList];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(targetIndex, 0, moved);
      const normalized = normalizeOrder(reordered);
      localOrderRef.current = normalized;
      setLocalOrder(normalized);
    }
  }

  function handlePointerUp() {
    if (!draggingId) return;
    const finalOrder = localOrderRef.current;
    setDraggingId(null);
    setLocalOrder(null);
    localOrderRef.current = null;
    if (finalOrder) {
      onCommit(finalOrder);
    }
  }

  const pinnedCount = items.filter((c) => c.is_pinned).length;

  return (
    <div
      className="mobile-modal-backdrop fixed inset-0 z-70 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="customize-categories-title"
        className="flex h-full w-full flex-col bg-paper sm:h-auto sm:max-h-[84vh] sm:max-w-lg sm:border-2 sm:border-ink/15 sm:shadow-[12px_12px_0_rgba(61,31,12,0.18)] dark:bg-[#211b17] sm:dark:border-white/10"
      >
        {/* Sticky header */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/15 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              {saving ? "Saving order…" : "Auto-saved"}
            </p>
            <h2 id="customize-categories-title" className="mt-0.5 font-display text-xl font-bold">
              Customize Categories
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 border border-ink bg-ink px-4 py-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-paper dark:border-[#f7eddd] dark:bg-[#f7eddd] dark:text-[#17120f]"
          >
            Done
          </button>
        </div>

        {/* Instructions */}
        <div className="border-b border-ink/10 bg-cream/40 px-5 py-3 text-xs text-ink-soft dark:border-white/10 dark:bg-white/[0.02] dark:text-[#cfc2af]">
          Drag <span className="font-bold text-ink dark:text-[#f7eddd]">☰</span> to reorder or tap{" "}
          <span className="font-bold text-ember-deep">📌</span> to pin priority categories at the
          top.
        </div>

        {/* Scrollable category list */}
        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-soft dark:text-[#cfc2af]">
              No categories to customize yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {items.map((cat, index) => {
                const isDragging = draggingId === cat.id;
                const isFirstUnpinned = !cat.is_pinned && index === pinnedCount && pinnedCount > 0;

                return (
                  <div key={cat.id}>
                    {isFirstUnpinned && (
                      <p className="mb-2 mt-3 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ink-soft dark:text-[#cfc2af]">
                        Other Categories
                      </p>
                    )}
                    {index === 0 && cat.is_pinned && (
                      <p className="mb-2 text-[0.56rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
                        Pinned
                      </p>
                    )}
                    <div
                      data-cat-row={cat.id}
                      className={`flex min-h-14 items-center gap-3 border px-3 py-2.5 transition-all duration-150 ${
                        isDragging
                          ? "scale-[1.01] border-ember-deep bg-cream shadow-md dark:bg-[#2c241e]"
                          : cat.is_pinned
                            ? "border-ember-deep/35 bg-ember-deep/[0.04] dark:border-ember-deep/30 dark:bg-ember-deep/[0.08]"
                            : "border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"
                      }`}
                    >
                      {/* One-tap Pin/Unpin */}
                      <button
                        type="button"
                        onClick={() => togglePin(cat.id)}
                        aria-label={cat.is_pinned ? `Unpin ${cat.name}` : `Pin ${cat.name}`}
                        title={cat.is_pinned ? "Unpin category" : "Pin category to top"}
                        className={`grid size-10 shrink-0 place-items-center border text-base transition-colors ${
                          cat.is_pinned
                            ? "border-ember-deep bg-ember-deep text-white"
                            : "border-ink/15 text-ink-soft hover:border-ink/40 dark:border-white/15 dark:text-[#cfc2af]"
                        }`}
                      >
                        📌
                      </button>

                      {/* Name & budget */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-bold">{cat.name}</p>
                        <p className="text-[0.65rem] text-ink-soft dark:text-[#cfc2af]">
                          Limit {formatCurrency(Number(cat.monthly_budget), "category_budgets")}
                        </p>
                      </div>

                      {/* Large touch-friendly drag handle */}
                      <button
                        type="button"
                        aria-label={`Drag to reorder ${cat.name}`}
                        onPointerDown={(e) => handlePointerDown(e, cat.id)}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center border border-ink/15 text-lg text-ink-soft active:cursor-grabbing dark:border-white/15 dark:text-[#cfc2af]"
                      >
                        ☰
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
