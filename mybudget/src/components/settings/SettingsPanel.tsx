"use client";

import { useEffect, useState } from "react";
import { AccountSettings } from "./AccountSettings";
import { DataSettings } from "./DataSettings";
import { DisplaySettings } from "./DisplaySettings";
import { ExpensesSettings } from "./ExpensesSettings";
import { GeneralSettings } from "./GeneralSettings";
import { HelpSettings } from "./HelpSettings";

type SettingsCategory =
  | "general"
  | "display"
  | "expenses"
  | "account"
  | "data"
  | "help";

type CategoryMeta = {
  id: SettingsCategory;
  icon: string;
  label: string;
  description: string;
};

const CATEGORIES: CategoryMeta[] = [
  { id: "general", icon: "◎", label: "General", description: "Currency, language, date format" },
  { id: "display", icon: "▤", label: "Display", description: "Theme, compact mode, font scale" },
  { id: "expenses", icon: "↗", label: "Expenses", description: "Layout, display, sorting" },
  { id: "account", icon: "◉", label: "Account", description: "Profile, password, session" },
  { id: "data", icon: "▥", label: "Data", description: "Export CSV, PDF, backup" },
  { id: "help", icon: "?", label: "Help", description: "Tutorial, guide, about" },
];

type SettingsPanelProps = {
  open: boolean;
  onClose: () => void;
  sessionUser: { id: string; username: string } | null;
  loggingOut: boolean;
  onLogout: () => void;
  onTutorial: () => void;
  onExportCsv: () => void;
};

export function SettingsPanel({
  open,
  onClose,
  sessionUser,
  loggingOut,
  onLogout,
  onTutorial,
  onExportCsv,
}: SettingsPanelProps) {
  // null = mobile home screen; on desktop we default to "general"
  const [activeCategory, setActiveCategory] = useState<SettingsCategory | null>(null);

  // On desktop (lg+), always show a category; default to "general".
  // On close, reset to mobile home screen.
  // Both effects call setState inside a Promise/async path to satisfy react-hooks/set-state-in-effect.
  useEffect(() => {
    if (!open) {
      Promise.resolve().then(() => setActiveCategory(null));
      return;
    }
    Promise.resolve().then(() => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop) {
        setActiveCategory((prev) => (prev === null ? "general" : prev));
      }
    });
  }, [open]);

  if (!open) return null;

  const activeMeta = CATEGORIES.find((c) => c.id === activeCategory);

  function renderContent() {
    switch (activeCategory) {
      case "general":
        return <GeneralSettings />;
      case "display":
        return <DisplaySettings />;
      case "expenses":
        return <ExpensesSettings />;
      case "account":
        return (
          <AccountSettings
            sessionUser={sessionUser}
            loggingOut={loggingOut}
            onLogout={onLogout}
          />
        );
      case "data":
        return <DataSettings onExportCsv={onExportCsv} />;
      case "help":
        return <HelpSettings onReplayTutorial={onTutorial} />;
      default:
        return null;
    }
  }

  return (
    /* Overlay */
    <div
      className="mobile-modal-backdrop fixed inset-0 z-70 flex items-end bg-ink/35 backdrop-blur-[2px] lg:items-center lg:justify-center lg:p-5"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className="mobile-modal-panel flex w-full flex-col border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] lg:max-h-[82vh] lg:max-w-4xl lg:flex-row dark:border-white/10 dark:bg-[#211b17]"
      >
        {/* ── LEFT NAV (desktop always visible; mobile only on home screen) ── */}
        <aside
          className={`shrink-0 border-b border-ink/15 lg:w-64 lg:border-b-0 lg:border-r dark:border-white/10 ${
            activeCategory !== null ? "hidden lg:flex" : "flex"
          } flex-col`}
        >
          {/* Nav header */}
          <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 dark:border-white/10">
            <div>
              <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                Preferences
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold">Settings</h2>
            </div>
            <button
              type="button"
              aria-label="Close settings"
              onClick={onClose}
              className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft hover:border-ink/40 dark:border-white/10"
            >
              ×
            </button>
          </div>

          {/* Category list */}
          <nav className="flex-1 overflow-y-auto py-2" aria-label="Settings categories">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`group flex w-full items-center gap-3 px-5 py-3 text-left transition-colors ${
                    isActive
                      ? "border-l-2 border-ember-deep bg-cream/60 dark:bg-white/5"
                      : "border-l-2 border-transparent hover:bg-cream/40 dark:hover:bg-white/4"
                  }`}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center border text-sm ${
                      isActive
                        ? "border-ember-deep/40 bg-ember-deep/10 text-ember-deep dark:border-ember-deep/30 dark:bg-ember-deep/15"
                        : "border-ink/15 text-ink-soft group-hover:border-ink/30 dark:border-white/10 dark:text-[#cfc2af]"
                    }`}
                  >
                    {cat.icon}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-semibold ${
                        isActive
                          ? "text-ink dark:text-[#f7eddd]"
                          : "text-ink-soft dark:text-[#cfc2af]"
                      }`}
                    >
                      {cat.label}
                    </p>
                    <p className="truncate text-[0.65rem] text-ink-soft dark:text-[#cfc2af]">
                      {cat.description}
                    </p>
                  </div>
                  {/* Mobile chevron */}
                  <span className="ml-auto text-ink-soft/50 lg:hidden">›</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── RIGHT CONTENT PANEL ── */}
        {activeCategory !== null && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Content header */}
            <div className="flex items-center gap-3 border-b border-ink/15 px-5 py-4 dark:border-white/10">
              {/* Mobile back button */}
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                aria-label="Back to settings"
                className="grid size-8 shrink-0 place-items-center border border-ink/15 text-sm text-ink-soft hover:border-ink/40 lg:hidden dark:border-white/10"
              >
                ‹
              </button>

              <div className="min-w-0 flex-1">
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
                  {activeMeta?.description}
                </p>
                <h3 className="font-display text-xl font-bold">{activeMeta?.label}</h3>
              </div>

              {/* Desktop close */}
              <button
                type="button"
                aria-label="Close settings"
                onClick={onClose}
                className="hidden size-9 shrink-0 place-items-center border border-ink/15 text-xl text-ink-soft hover:border-ink/40 lg:grid dark:border-white/10"
              >
                ×
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-5 lg:p-6">{renderContent()}</div>
          </div>
        )}
      </div>
    </div>
  );
}
