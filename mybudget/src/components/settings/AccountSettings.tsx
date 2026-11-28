"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { validatePasswordStrength, validateUsername } from "@/lib/account-validation";

type AccountSettingsProps = {
  sessionUser: { id: string; username: string } | null;
  loggingOut: boolean;
  onLogout: () => void;
};

export function AccountSettings({ sessionUser, loggingOut, onLogout }: AccountSettingsProps) {
  const router = useRouter();

  // Profile / Account fields
  const [username, setUsername] = useState(sessionUser?.username ?? "");
  const [fullName, setFullName] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingAccount, setSavingAccount] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [accountSuccess, setAccountSuccess] = useState("");

  // Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.profile
      .get()
      .then((profile) => {
        if (cancelled) return;
        setUsername(profile.username ?? sessionUser?.username ?? "");
        setFullName(profile.full_name ?? "");
        setLoadingProfile(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionUser?.username]);

  async function handleAccountSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAccountError("");
    setAccountSuccess("");

    const check = validateUsername(username);
    if (!check.valid) {
      setAccountError(check.error ?? "Invalid username.");
      return;
    }

    setSavingAccount(true);
    try {
      const updated = await api.account.update({
        username: check.normalized,
        full_name: fullName.trim(),
      });
      setUsername(updated.username || check.normalized);
      setFullName(updated.full_name ?? "");
      setAccountSuccess("Account details updated.");
      router.refresh();
    } catch (reason) {
      setAccountError(
        reason instanceof Error ? reason.message : "Could not update account details.",
      );
    } finally {
      setSavingAccount(false);
    }
  }

  async function handlePasswordUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Enter your current password.");
      return;
    }

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      setPasswordError(strength.error ?? "Invalid new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api.account.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(res.message || "Password updated successfully.");
    } catch (reason) {
      setPasswordError(
        reason instanceof Error ? reason.message : "Could not update password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  const displayInitial =
    (fullName.trim() || username.trim() || sessionUser?.username || "?").charAt(0).toUpperCase();

  const labelClass =
    "text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft dark:text-[#cfc2af]";
  const inputClass =
    "mt-1.5 w-full border border-ink/15 bg-paper px-3 py-2.5 text-sm outline-none focus:border-ember-deep dark:border-white/15 dark:bg-[#1a1512] dark:text-[#f7eddd]";

  return (
    <div className="grid gap-6">
      {/* Account Overview & Profile */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Account
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Profile &amp; Username</h3>

        <div className="mt-3 border border-ink/15 dark:border-white/10">
          <div className="flex items-center gap-4 border-b border-ink/10 px-4 py-3.5 dark:border-white/10">
            <div className="grid size-11 shrink-0 place-items-center border border-ink/15 bg-ink text-base font-bold text-paper dark:border-white/10">
              {displayInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold dark:text-[#f7eddd]">
                {fullName.trim() || username || sessionUser?.username || "Active session"}
              </p>
              <p className="mt-0.5 truncate text-xs text-ink-soft dark:text-[#cfc2af]">
                @{username || sessionUser?.username || "user"}
              </p>
            </div>
          </div>

          <form onSubmit={handleAccountSave} className="grid gap-4 p-4">
            <label className="block">
              <span className={labelClass}>Username</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loadingProfile || savingAccount}
                placeholder="laurenz"
                autoComplete="username"
                className={`${inputClass} disabled:opacity-60`}
              />
              <span className="mt-1 block text-[0.7rem] text-ink-soft dark:text-[#cfc2af]">
                Lowercase letters, numbers, underscores, or hyphens (min 3 characters, no spaces).
              </span>
            </label>

            <label className="block">
              <span className={labelClass}>Full Name</span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loadingProfile || savingAccount}
                placeholder="Laurenz"
                autoComplete="name"
                className={`${inputClass} disabled:opacity-60`}
              />
            </label>

            {accountError ? (
              <p className="border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-200">
                {accountError}
              </p>
            ) : null}
            {accountSuccess ? (
              <p className="border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-950/40 dark:text-emerald-200">
                {accountSuccess}
              </p>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loadingProfile || savingAccount}
                className="border-2 border-ink bg-ember-deep px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ember-deep/90 disabled:opacity-60"
              >
                {savingAccount ? "Saving…" : "Save Account"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <hr className="border-ink/15 dark:border-white/10" />

      {/* Change Password */}
      <section>
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">
          Security
        </p>
        <h3 className="mt-0.5 font-display text-lg font-bold">Change Password</h3>

        <form
          onSubmit={handlePasswordUpdate}
          className="mt-3 grid gap-4 border border-ink/15 p-4 dark:border-white/10"
        >
          <label className="block">
            <span className={labelClass}>Current Password</span>
            <div className="relative mt-1.5">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={savingPassword}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full border border-ink/15 bg-paper py-2.5 pl-3 pr-10 text-sm outline-none focus:border-ember-deep disabled:opacity-60 dark:border-white/15 dark:bg-[#1a1512] dark:text-[#f7eddd]"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((prev) => !prev)}
                aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                aria-pressed={showCurrentPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft transition-colors hover:text-ink dark:text-[#cfc2af]"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          <label className="block">
            <span className={labelClass}>New Password</span>
            <div className="relative mt-1.5">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={savingPassword}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-ink/15 bg-paper py-2.5 pl-3 pr-10 text-sm outline-none focus:border-ember-deep disabled:opacity-60 dark:border-white/15 dark:bg-[#1a1512] dark:text-[#f7eddd]"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                aria-pressed={showNewPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft transition-colors hover:text-ink dark:text-[#cfc2af]"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            <span className="mt-1 block text-[0.7rem] text-ink-soft dark:text-[#cfc2af]">
              Minimum 8 characters, including at least one letter and one number.
            </span>
          </label>

          <label className="block">
            <span className={labelClass}>Confirm Password</span>
            <div className="relative mt-1.5">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={savingPassword}
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full border border-ink/15 bg-paper py-2.5 pl-3 pr-10 text-sm outline-none focus:border-ember-deep disabled:opacity-60 dark:border-white/15 dark:bg-[#1a1512] dark:text-[#f7eddd]"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                aria-pressed={showConfirmPassword}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-soft transition-colors hover:text-ink dark:text-[#cfc2af]"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </label>

          {passwordError ? (
            <p className="border border-red-700/20 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-200">
              {passwordError}
            </p>
          ) : null}
          {passwordSuccess ? (
            <p className="border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-950/40 dark:text-emerald-200">
              {passwordSuccess}
            </p>
          ) : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="border-2 border-ink bg-ember-deep px-4 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-ember-deep/90 disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </section>

      <hr className="border-ink/15 dark:border-white/10" />

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
