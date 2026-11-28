"use client";

import { useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  formatDisplayDate,
  updateBudgetBehavior,
  updateDateFormat,
  updateDefaultCategorySort,
  updateDefaultPageSize,
  updateDefaultSort,
  updateExpenseLayout,
  useDateFormat,
} from "@/lib/app-preferences";
import {
  validateBackupPayload,
  type BackupSummary,
  type ConflictStrategy,
  type MyBudgetBackup,
  type RestoreMode,
} from "@/lib/backup";
import { getCurrencySettings, updateCurrencySettings } from "@/lib/currency";
import {
  updateAutoHideOnStartup,
  updateDefaultAmountVisibility,
  updateHideAmounts,
  updatePrivacyConfig,
} from "@/lib/privacy-preferences";
import {
  updateCategoryIndicatorStyle,
  updateTransactionDisplayMode,
  updateTransactionInteraction,
} from "@/lib/transaction-preferences";

type DataSettingsProps = {
  onExportCsv: () => void;
};

type RestoreReport = {
  mode: RestoreMode;
  restored: Record<string, number>;
  skipped: Record<string, number>;
};

export function DataSettings({ onExportCsv }: DataSettingsProps) {
  const dateFormat = useDateFormat();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [parsedBackup, setParsedBackup] = useState<MyBudgetBackup | null>(null);
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [validationError, setValidationError] = useState<string>("");

  const [restoreMode, setRestoreMode] = useState<RestoreMode>("merge");
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>("skip");
  const [replaceConfirmation, setReplaceConfirmation] = useState<string>("");
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string>("");
  const [restoreReport, setRestoreReport] = useState<RestoreReport | null>(null);

  async function handleDownloadBackup() {
    setDownloadingBackup(true);
    setBackupFeedback(null);
    try {
      const currency = getCurrencySettings();
      const theme =
        typeof window !== "undefined" ? window.localStorage.getItem("mybudget-theme") ?? undefined : undefined;
      const { blob, filename } = await api.backup.download({
        theme,
        currency: currency.code,
        usdToPhp: currency.usdToPhp,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setBackupFeedback({ type: "success", text: `Downloaded ${filename}` });
    } catch (err) {
      setBackupFeedback({
        type: "error",
        text: err instanceof Error ? err.message : "Could not create backup.",
      });
    } finally {
      setDownloadingBackup(false);
    }
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setRestoreError("");
    setRestoreReport(null);
    setValidationError("");
    setParsedBackup(null);
    setBackupSummary(null);
    setReplaceConfirmation("");

    if (!file) {
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);

    if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
      setValidationError("Unsupported file format. Please select a .json backup file.");
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = validateBackupPayload(json);
      if (!result.valid) {
        setValidationError(result.error);
        return;
      }
      setParsedBackup(result.backup);
      setBackupSummary(result.summary);
    } catch {
      setValidationError("Could not read backup file. Ensure it is valid, uncorrupted JSON.");
    }
  }

  function applyClientSettings(settings?: {
    preferences?: Record<string, unknown>;
    privacy?: Record<string, boolean>;
    local_settings?: Record<string, unknown> | null;
  }) {
    if (!settings) return;
    const prefs = settings.preferences ?? {};
    if (prefs.expenseLayout === "transactions_first" || prefs.expenseLayout === "categories_first") {
      updateExpenseLayout(prefs.expenseLayout);
    }
    if (prefs.transactionDisplay === "pagination" || prefs.transactionDisplay === "infinite") {
      updateTransactionDisplayMode(prefs.transactionDisplay);
    }
    if (
      prefs.categoryIndicatorStyle === "bar_dot" ||
      prefs.categoryIndicatorStyle === "bar" ||
      prefs.categoryIndicatorStyle === "dot" ||
      prefs.categoryIndicatorStyle === "minimal"
    ) {
      updateCategoryIndicatorStyle(prefs.categoryIndicatorStyle);
    }
    if (
      prefs.dateFormat === "MM/DD/YYYY" ||
      prefs.dateFormat === "DD/MM/YYYY" ||
      prefs.dateFormat === "YYYY-MM-DD" ||
      prefs.dateFormat === "MMM D"
    ) {
      updateDateFormat(prefs.dateFormat);
    }
    if (prefs.budgetBehavior === "carry_forward" || prefs.budgetBehavior === "manual") {
      updateBudgetBehavior(prefs.budgetBehavior);
    }
    if (prefs.pageSize === 10 || prefs.pageSize === 25 || prefs.pageSize === 50 || prefs.pageSize === 100) {
      updateDefaultPageSize(prefs.pageSize);
    }
    if (
      prefs.defaultSort === "date_desc" ||
      prefs.defaultSort === "date_asc" ||
      prefs.defaultSort === "amount_desc" ||
      prefs.defaultSort === "amount_asc"
    ) {
      updateDefaultSort(prefs.defaultSort);
    }
    if (typeof prefs.defaultCategorySort === "string") {
      updateDefaultCategorySort(prefs.defaultCategorySort as Parameters<typeof updateDefaultCategorySort>[0]);
    }
    if (prefs.defaultAmountVisibility === "show" || prefs.defaultAmountVisibility === "hide") {
      updateDefaultAmountVisibility(prefs.defaultAmountVisibility);
    }
    if (typeof prefs.autoHideOnStartup === "boolean") {
      updateAutoHideOnStartup(prefs.autoHideOnStartup);
    }
    if (prefs.transactionInteraction === "floating" || prefs.transactionInteraction === "inline") {
      updateTransactionInteraction(prefs.transactionInteraction);
    }

    const privacy = settings.privacy ?? {};
    if (typeof privacy.hide_amounts === "boolean") {
      updateHideAmounts(privacy.hide_amounts);
    }
    updatePrivacyConfig({
      ...(typeof privacy.hide_dashboard === "boolean" ? { hide_dashboard: privacy.hide_dashboard } : {}),
      ...(typeof privacy.hide_category_budgets === "boolean"
        ? { hide_category_budgets: privacy.hide_category_budgets }
        : {}),
      ...(typeof privacy.hide_transactions === "boolean"
        ? { hide_transactions: privacy.hide_transactions }
        : {}),
      ...(typeof privacy.hide_accounts === "boolean" ? { hide_accounts: privacy.hide_accounts } : {}),
      ...(typeof privacy.hide_goals_savings === "boolean"
        ? { hide_goals_savings: privacy.hide_goals_savings }
        : {}),
      ...(typeof privacy.hide_reports === "boolean" ? { hide_reports: privacy.hide_reports } : {}),
    });

    const local = settings.local_settings;
    if (local && typeof window !== "undefined") {
      if (local.theme === "dark" || local.theme === "light") {
        window.localStorage.setItem("mybudget-theme", local.theme);
        document.documentElement.classList.toggle("dark", local.theme === "dark");
        window.dispatchEvent(new Event("mybudget-theme-change"));
      }
      if (local.currency === "USD" || local.currency === "PHP") {
        updateCurrencySettings({
          code: local.currency,
          usdToPhp:
            typeof local.usdToPhp === "number" && local.usdToPhp > 0
              ? local.usdToPhp
              : getCurrencySettings().usdToPhp,
        });
      }
    }
  }

  async function handleRestore() {
    if (!parsedBackup) return;
    if (restoreMode === "replace" && replaceConfirmation.trim() !== "RESTORE") {
      setRestoreError('Type "RESTORE" to confirm replacing your existing data.');
      return;
    }

    setRestoring(true);
    setRestoreError("");
    setRestoreReport(null);

    try {
      const result = await api.backup.restore({
        backup: parsedBackup,
        mode: restoreMode,
        conflictStrategy: restoreMode === "merge" ? conflictStrategy : undefined,
        confirmation: restoreMode === "replace" ? replaceConfirmation.trim() : undefined,
      });

      applyClientSettings(result.settings);
      setRestoreReport({
        mode: result.mode,
        restored: result.restored,
        skipped: result.skipped,
      });
      setReplaceConfirmation("");
      window.dispatchEvent(new Event("mybudget-data-restored"));
    } catch (err) {
      setRestoreError(err instanceof Error ? err.message : "Failed to restore backup.");
    } finally {
      setRestoring(false);
    }
  }

  const canRestore =
    Boolean(parsedBackup) &&
    !restoring &&
    (restoreMode === "merge" || replaceConfirmation.trim() === "RESTORE");

  return (
    <div className="grid gap-6">
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Data
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Export &amp; Backup</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Download your financial data, create a full JSON backup, or restore from a previous backup.
        </p>
      </section>

      {/* Export */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Export
        </p>
        <div className="mt-2 grid gap-2">
          <div className="flex items-center justify-between border border-ink/15 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold dark:text-[#f7eddd]">Export CSV</p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                All transactions as a spreadsheet
              </p>
            </div>
            <button
              type="button"
              onClick={onExportCsv}
              className="shrink-0 border border-ink/15 px-3.5 py-2 text-[0.58rem] font-bold uppercase tracking-[0.13em] hover:border-ink/40 dark:border-white/15 dark:text-[#f7eddd] dark:hover:border-white/40"
            >
              Download
            </button>
          </div>

          <div className="flex items-center justify-between border border-ink/15 px-4 py-3 dark:border-white/10">
            <div>
              <p className="text-sm font-semibold dark:text-[#f7eddd]">Export PDF</p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                Print-ready financial report
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="shrink-0 border border-ink/15 px-3.5 py-2 text-[0.58rem] font-bold uppercase tracking-[0.13em] hover:border-ink/40 dark:border-white/15 dark:text-[#f7eddd] dark:hover:border-white/40"
            >
              Print
            </button>
          </div>
        </div>
      </section>

      {/* Create Backup */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Backup
        </p>
        <div className="mt-2 border border-ink/15 p-4 dark:border-white/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold dark:text-[#f7eddd]">Create Backup</p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                Download a complete JSON copy of your accounts, categories, transactions, goals, budgets, and preferences.
              </p>
            </div>
            <button
              type="button"
              disabled={downloadingBackup}
              onClick={() => void handleDownloadBackup()}
              className="shrink-0 bg-ember-deep px-4 py-2.5 text-[0.6rem] font-bold uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-50"
            >
              {downloadingBackup ? "Preparing..." : "Download Backup"}
            </button>
          </div>
          {backupFeedback && (
            <p
              className={`mt-2 text-xs ${
                backupFeedback.type === "success"
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {backupFeedback.text}
            </p>
          )}
        </div>
      </section>

      {/* Restore Backup */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Restore Backup
        </p>
        <div className="mt-2 border border-ink/15 p-4 dark:border-white/10">
          <p className="text-xs text-ink-soft dark:text-[#cfc2af]">
            Recover financial records and preferences from a previous <code className="font-mono">.json</code> backup file.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(e) => void handleFileSelect(e)}
            className="hidden"
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border border-ink/20 px-4 py-2 text-[0.6rem] font-bold uppercase tracking-[0.14em] transition-colors hover:border-ember-deep hover:text-ember-deep dark:border-white/15 dark:text-[#f7eddd]"
            >
              Select Backup File
            </button>
            {selectedFileName && (
              <span className="truncate text-xs font-medium text-ink-soft dark:text-[#cfc2af]">
                {selectedFileName}
              </span>
            )}
          </div>

          {validationError && (
            <div className="mt-3 border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {validationError}
            </div>
          )}

          {backupSummary && (
            <div className="mt-4 space-y-4">
              {/* Backup Summary */}
              <div className="border border-ink/15 bg-ink/2 p-3.5 dark:border-white/10 dark:bg-white/2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ember-deep">
                    Backup Summary
                  </p>
                  <p className="text-[0.65rem] text-ink-soft dark:text-[#cfc2af]">
                    v{backupSummary.version} · {formatDisplayDate(backupSummary.exportedAt.slice(0, 10), dateFormat)}
                  </p>
                </div>
                <ul className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs dark:text-[#f7eddd]">
                  <li>✓ {backupSummary.accountsCount} Accounts</li>
                  <li>✓ {backupSummary.categoriesCount} Categories</li>
                  <li>✓ {backupSummary.transactionsCount} Transactions</li>
                  <li>✓ {backupSummary.budgetsCount} Budgets</li>
                  <li>✓ {backupSummary.savingsGoalsCount} Savings Goals</li>
                  <li>✓ {backupSummary.financialGoalsCount} Financial Goals</li>
                  <li>✓ {backupSummary.recurringTransactionsCount} Recurring Rules</li>
                  <li>
                    {backupSummary.hasPreferences ? "✓ User Preferences Found" : "— No Preferences"}
                  </li>
                </ul>
              </div>

              {/* Restore Mode */}
              <div>
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                  Restore Mode
                </p>
                <div className="mt-2 grid gap-2">
                  <label className="flex cursor-pointer items-start gap-3 border border-ink/15 p-3 dark:border-white/10">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="merge"
                      checked={restoreMode === "merge"}
                      onChange={() => setRestoreMode("merge")}
                      className="mt-0.5 accent-ember-deep"
                    />
                    <div>
                      <p className="text-sm font-semibold dark:text-[#f7eddd]">
                        Merge With Existing Data <span className="text-xs font-normal text-ember-deep">(Recommended)</span>
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                        Add missing records, preserve existing records, and merge preferences safely.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 border border-ink/15 p-3 dark:border-white/10">
                    <input
                      type="radio"
                      name="restore-mode"
                      value="replace"
                      checked={restoreMode === "replace"}
                      onChange={() => setRestoreMode("replace")}
                      className="mt-0.5 accent-ember-deep"
                    />
                    <div>
                      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                        Replace Existing Data
                      </p>
                      <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                        Delete all current records and rebuild your workspace entirely from this backup.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Conflict Strategy (Merge mode) */}
              {restoreMode === "merge" && (
                <div>
                  <label className="block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
                    Duplicate Handling
                  </label>
                  <select
                    value={conflictStrategy}
                    onChange={(e) => setConflictStrategy(e.target.value as ConflictStrategy)}
                    className="mt-1.5 w-full border border-ink/15 bg-paper px-3 py-2 text-xs font-semibold outline-none dark:border-white/15 dark:bg-[#211b17] dark:text-[#f7eddd]"
                  >
                    <option value="skip">Skip duplicates (Recommended)</option>
                    <option value="merge">Merge duplicates (update matching accounts/categories/goals)</option>
                    <option value="rename">Rename imported items (keep both copies)</option>
                  </select>
                </div>
              )}

              {/* Confirmation (Replace mode) */}
              {restoreMode === "replace" && (
                <div className="border border-red-500/30 bg-red-500/5 p-3">
                  <label className="block text-xs font-semibold text-red-700 dark:text-red-400">
                    Type <span className="font-mono">RESTORE</span> to confirm replacing all existing data:
                  </label>
                  <input
                    type="text"
                    value={replaceConfirmation}
                    onChange={(e) => setReplaceConfirmation(e.target.value)}
                    placeholder="RESTORE"
                    className="mt-2 w-full border border-red-500/30 bg-paper px-3 py-2 text-sm outline-none dark:bg-[#211b17] dark:text-[#f7eddd]"
                  />
                </div>
              )}

              {restoreError && (
                <div className="border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-700 dark:text-red-400">
                  {restoreError}
                </div>
              )}

              <button
                type="button"
                disabled={!canRestore}
                onClick={() => void handleRestore()}
                className="w-full bg-ember-deep py-2.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {restoring ? "Restoring Backup..." : "Restore Backup"}
              </button>
            </div>
          )}

          {restoreReport && (
            <div className="mt-4 border border-green-600/30 bg-green-600/5 p-3.5 text-xs dark:border-green-400/25">
              <p className="font-bold text-green-700 dark:text-green-400">
                Backup restored ({restoreReport.mode === "merge" ? "Merged" : "Replaced"}).
              </p>
              <p className="mt-1 text-ink-soft dark:text-[#cfc2af]">
                Restored {restoreReport.restored.accounts ?? 0} accounts,{" "}
                {restoreReport.restored.categories ?? 0} categories,{" "}
                {restoreReport.restored.transactions ?? 0} transactions,{" "}
                {restoreReport.restored.budgets ?? 0} budgets,{" "}
                {restoreReport.restored.savings_goals ?? 0} savings goals,{" "}
                {restoreReport.restored.financial_goals ?? 0} financial goals, and{" "}
                {restoreReport.restored.recurring_transactions ?? 0} recurring rules.
                {restoreReport.mode === "merge" && (restoreReport.skipped.transactions ?? 0) > 0
                  ? ` Skipped ${restoreReport.skipped.transactions} duplicate transactions.`
                  : ""}
              </p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-2 font-bold uppercase tracking-[0.12em] text-ember-deep hover:underline"
              >
                Reload page to refresh data →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
