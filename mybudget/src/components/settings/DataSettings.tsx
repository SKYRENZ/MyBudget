"use client";

type DataSettingsProps = {
  onExportCsv: () => void;
};

export function DataSettings({ onExportCsv }: DataSettingsProps) {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Data
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Export &amp; Backup</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Download your financial data or create a backup.
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

      {/* Backup / Restore (placeholder) */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Backup
        </p>
        <div className="mt-2 divide-y divide-ink/10 border border-ink/15 dark:divide-white/8 dark:border-white/10">
          {["Backup Data", "Restore Data"].map((label) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold dark:text-[#f7eddd]">{label}</p>
                <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                  {label === "Backup Data" ? "Save a local copy" : "Recover from backup"}
                </p>
              </div>
              <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
                Soon
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
