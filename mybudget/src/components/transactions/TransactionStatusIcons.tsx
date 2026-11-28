"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, Repeat } from "lucide-react";
import { isTransactionEditable } from "@/components/transactions/TransactionActionsMenu";
import type { Transaction } from "@/lib/database-types";

type ActiveTooltip = "recurring" | "locked" | null;

export function TransactionStatusIcons({ transaction }: { transaction: Transaction }) {
  const isLocked = !isTransactionEditable(transaction);
  const isRecurring = Boolean(transaction.recurring_transaction_id || transaction.is_auto_generated);
  const [activeTooltip, setActiveTooltip] = useState<ActiveTooltip>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!activeTooltip) return;
    function handleOutside(event: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveTooltip(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveTooltip(null);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeTooltip]);

  if (!isLocked && !isRecurring) {
    return null;
  }

  return (
    <span ref={containerRef} className="inline-flex items-center gap-1.5 align-middle">
      <span aria-hidden="true" className="text-ink-soft/70 dark:text-[#cfc2af]/60">
        ·
      </span>

      {isRecurring && (
        <span className="relative inline-flex items-center group/icon">
          <button
            type="button"
            title="Recurring Transaction"
            aria-label="Recurring Transaction"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip((prev) => (prev === "recurring" ? null : "recurring"));
            }}
            className="inline-flex items-center justify-center rounded-sm p-0.5 text-amber-700/85 transition-colors hover:text-amber-800 focus-visible:outline-1 focus-visible:outline-amber-700 dark:text-amber-400/80 dark:hover:text-amber-300"
          >
            <Repeat className="size-[13px]" strokeWidth={2} aria-hidden="true" />
          </button>
          <span
            role="tooltip"
            className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap border border-ink/15 bg-paper px-2 py-1 text-[0.62rem] font-medium tracking-normal text-ink shadow-md transition-opacity dark:border-white/15 dark:bg-[#1e1812] dark:text-[#f7eddd] ${
              activeTooltip === "recurring"
                ? "opacity-100"
                : "opacity-0 group-hover/icon:opacity-100"
            }`}
          >
            Recurring Transaction
          </span>
        </span>
      )}

      {isLocked && (
        <span className="relative inline-flex items-center group/icon">
          <button
            type="button"
            title="Transaction Locked"
            aria-label="Transaction Locked"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTooltip((prev) => (prev === "locked" ? null : "locked"));
            }}
            className="inline-flex items-center justify-center rounded-sm p-0.5 text-ink-soft/75 transition-colors hover:text-ink dark:text-[#cfc2af]/65 dark:hover:text-[#f7eddd]"
          >
            <Lock className="size-[13px]" strokeWidth={2} aria-hidden="true" />
          </button>
          <span
            role="tooltip"
            className={`pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 -translate-x-1/2 whitespace-nowrap border border-ink/15 bg-paper px-2 py-1 text-[0.62rem] font-medium tracking-normal text-ink shadow-md transition-opacity dark:border-white/15 dark:bg-[#1e1812] dark:text-[#f7eddd] ${
              activeTooltip === "locked"
                ? "opacity-100"
                : "opacity-0 group-hover/icon:opacity-100"
            }`}
          >
            Transaction Locked
          </span>
        </span>
      )}
    </span>
  );
}
