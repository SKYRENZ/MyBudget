"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import {
  APP_VERSION,
  CHANGELOG_RELEASES,
  VERSION_TYPE_GUIDE,
  type ReleaseType,
} from "@/lib/changelog";

type ChangelogModalProps = {
  open: boolean;
  onClose: () => void;
};

const TYPE_LABELS: Record<ReleaseType, string> = {
  patch: "Patch",
  minor: "Minor",
  major: "Major",
};

export function ChangelogModal({ open, onClose }: ChangelogModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="mobile-modal-backdrop fixed inset-0 z-80 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Changelog"
        className="mobile-modal-panel flex max-h-[86dvh] w-full flex-col border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-xl dark:border-white/15 dark:bg-[#211b17]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ink/15 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
              Release History · v{APP_VERSION}
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold">What&apos;s New in MyBudget</h2>
          </div>
          <button
            type="button"
            aria-label="Close changelog"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center border border-ink/15 text-ink-soft hover:border-ink/40 hover:text-ink dark:border-white/15 dark:text-[#cfc2af] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Releases */}
        <div className="flex-1 divide-y divide-ink/15 overflow-y-auto px-5 py-2 dark:divide-white/10">
          {CHANGELOG_RELEASES.map((release) => (
            <article key={release.version} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-xl font-bold">
                    Version {release.version}
                  </h3>
                  <span className="border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-ember-deep dark:border-white/15">
                    {TYPE_LABELS[release.type]}
                  </span>
                </div>
                <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
                  Released: {release.releaseDate}
                </p>
              </div>

              {release.title && (
                <p className="mt-1 text-xs font-semibold text-ink-soft dark:text-[#cfc2af]">
                  {release.title}
                </p>
              )}

              <div className="mt-4 grid gap-4">
                {release.added.length > 0 && (
                  <ReleaseSection title="Added" items={release.added} />
                )}
                {release.improved.length > 0 && (
                  <ReleaseSection title="Improved" items={release.improved} />
                )}
                {release.fixed.length > 0 && (
                  <ReleaseSection title="Fixed" items={release.fixed} />
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Versioning Guide Footer */}
        <div className="border-t border-ink/15 bg-ink/2 px-5 py-3.5 dark:border-white/10 dark:bg-white/2">
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
            Versioning · Major.Minor.Patch
          </p>
          <div className="mt-1.5 grid gap-1 text-[0.7rem] text-ink-soft sm:grid-cols-3 sm:gap-3 dark:text-[#cfc2af]">
            {VERSION_TYPE_GUIDE.map((item) => (
              <p key={item.type}>
                <span className="font-bold text-ink dark:text-[#f7eddd]">{item.label}:</span>{" "}
                {item.description}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReleaseSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
        {title}
      </p>
      <ul className="mt-1.5 space-y-1 text-xs leading-relaxed dark:text-[#f7eddd]">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2">
            <span className="shrink-0 font-bold text-ember-deep" aria-hidden="true">
              ✓
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
