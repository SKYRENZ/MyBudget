"use client";

import { Suspense, type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearLegacyAuthStorage } from "@/lib/api";
import { AccentBars } from "@/components/landing/AccentBars";

function AuthForm() {
  const router = useRouter();
  const initialMode = "login";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.auth
      .session()
      .then((res) => {
        if (!cancelled && res.authenticated) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError("Enter both your username and password.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && password !== retypePassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      clearLegacyAuthStorage();
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      const payload = (await response.json().catch(() => null)) as {
        authenticated?: boolean;
        message?: string;
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Authentication failed.");
      }

      if (payload?.authenticated) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        setMessage(
          payload?.message ??
            "Account created. Please sign in with your username and password."
        );
        setMode("login");
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-cream px-5 py-10 pb-[calc(2.5rem+var(--keyboard-inset,0px))]">
      <section className="w-full max-w-md border border-ink/15 bg-paper px-6 py-7 shadow-[8px_8px_0_rgba(61,31,12,0.10)] sm:px-8 sm:py-9">
        <Link href="/" className="inline-flex font-display text-2xl font-bold text-ink">MYBUDGET</Link>
        <AccentBars className="mt-6" />

        <h1 className="mt-5 font-display text-3xl font-bold text-ink">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {mode === "login" ? "Sign in to continue your budget." : "Start planning your money with MyBudget."}
        </p>

        <div className="mt-6 grid grid-cols-2 border border-ink/15">
          <button type="button" onClick={() => setMode("login")} className={`py-3 text-xs font-bold uppercase tracking-[0.16em] ${mode === "login" ? "bg-ink text-paper" : "text-ink-soft"}`}>Log in</button>
          <button type="button" onClick={() => setMode("signup")} className={`py-3 text-xs font-bold uppercase tracking-[0.16em] ${mode === "signup" ? "bg-ink text-paper" : "text-ink-soft"}`}>Sign up</button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Username</span><input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required className="mt-2 w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-ember-deep" /></label>
          <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6} className="mt-2 w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-ember-deep" /></label>
          {mode === "signup" ? (
            <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Retype Password</span><input type="password" value={retypePassword} onChange={(event) => setRetypePassword(event.target.value)} autoComplete="new-password" required minLength={6} className="mt-2 w-full border border-ink/20 bg-cream px-4 py-3 text-sm outline-none focus:border-ember-deep" /></label>
          ) : null}

          {error ? <p className="border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
          {message ? <p className="border border-emerald-700/20 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}

          <button type="submit" disabled={busy} className="w-full border-2 border-ink bg-ember px-5 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-paper shadow-[5px_5px_0_0_var(--color-ink)] disabled:opacity-60">
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
