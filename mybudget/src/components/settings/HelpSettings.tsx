"use client";

type HelpSettingsProps = {
  onReplayTutorial: () => void;
};

export function HelpSettings({ onReplayTutorial }: HelpSettingsProps) {
  return (
    <div className="grid gap-6">
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Help
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Support &amp; Resources</h3>
        <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
          Get guidance, replay the tutorial, or learn more about MyBudget.
        </p>
      </section>

      {/* Tutorial */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Onboarding
        </p>
        <div className="mt-2 flex items-center justify-between border border-ink/15 px-4 py-3 dark:border-white/10">
          <div>
            <p className="text-sm font-semibold dark:text-[#f7eddd]">Replay Tutorial</p>
            <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
              Walk through accounts, categories, goals, and transactions.
            </p>
          </div>
          <button
            type="button"
            onClick={onReplayTutorial}
            className="shrink-0 border border-ink/15 px-3.5 py-2 text-[0.58rem] font-bold uppercase tracking-[0.13em] hover:border-ink/40 dark:border-white/15 dark:text-[#f7eddd] dark:hover:border-white/40"
          >
            Replay
          </button>
        </div>
      </section>

      {/* Resources */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Resources
        </p>
        <div className="mt-2 divide-y divide-ink/10 border border-ink/15 dark:divide-white/8 dark:border-white/10">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold dark:text-[#f7eddd]">Getting Started Guide</p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                Step-by-step setup documentation
              </p>
            </div>
            <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
              Soon
            </span>
          </div>
        </div>
      </section>

      {/* About */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          About
        </p>
        <div className="mt-2 border border-ink/15 p-4 dark:border-white/10">
          <p className="font-display text-xl font-bold">MyBudget</p>
          <p className="mt-1 text-xs text-ink-soft dark:text-[#cfc2af]">
            A premium personal finance journal for deliberate spending.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="border border-ink/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
              v0.1.0
            </span>
            <span className="text-xs text-ink-soft dark:text-[#cfc2af]">
              Built with Next.js &amp; Supabase
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
