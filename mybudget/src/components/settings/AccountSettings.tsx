"use client";

type AccountSettingsProps = {
  sessionUser: { id: string; username: string } | null;
  loggingOut: boolean;
  onLogout: () => void;
};

export function AccountSettings({ sessionUser, loggingOut, onLogout }: AccountSettingsProps) {
  return (
    <div className="grid gap-6">
      {/* Profile */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Account
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Profile</h3>
        <div className="mt-3 border border-ink/15 dark:border-white/10">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="grid size-12 shrink-0 place-items-center border border-ink/15 bg-ink text-paper text-lg font-bold dark:border-white/10">
              {sessionUser?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold dark:text-[#f7eddd]">
                {sessionUser?.username ?? "Active session"}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">
                Session secured via HttpOnly cookie
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder rows */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Settings
        </p>
        <div className="mt-2 divide-y divide-ink/10 border border-ink/15 dark:divide-white/8 dark:border-white/10">
          {[
            { label: "Profile Information", hint: "Edit display name" },
            { label: "Email Address", hint: "Update your email" },
            { label: "Change Password", hint: "Update your password" },
          ].map(({ label, hint }) => (
            <div
              key={label}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold dark:text-[#f7eddd]">{label}</p>
                <p className="mt-0.5 text-xs text-ink-soft dark:text-[#cfc2af]">{hint}</p>
              </div>
              <span className="rounded border border-ink/15 px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-widest text-ink-soft dark:border-white/10 dark:text-[#cfc2af]">
                Soon
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section>
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]">
          Session
        </p>
        <div className="mt-2 border border-red-700/20 p-4 dark:border-red-400/20">
          <p className="text-sm font-semibold text-red-900 dark:text-red-200">Sign out</p>
          <p className="mt-1 text-xs text-red-800/70 dark:text-red-300/70">
            You will be redirected to the login page.
          </p>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="mt-3 border border-red-700/30 bg-red-50 px-4 py-2.5 text-[0.58rem] font-bold uppercase tracking-[0.13em] text-red-800 transition-colors hover:border-red-700 hover:bg-red-100 disabled:opacity-60 dark:border-red-400/30 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-900/50"
          >
            {loggingOut ? "Logging out…" : "Log out of MyBudget"}
          </button>
        </div>
      </section>
    </div>
  );
}
