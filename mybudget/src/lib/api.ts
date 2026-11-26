import { supabase } from "@/lib/supabase";

async function authorizedFetch(path: string, init?: RequestInit) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to access your budget");

  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  dashboard: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set("month", String(month));
    if (year) params.set("year", String(year));
    return authorizedFetch(`/api/dashboard${params.size ? `?${params}` : ""}`);
  },
  accounts: {
    list: () => authorizedFetch("/api/accounts"),
    create: (body: unknown) => authorizedFetch("/api/accounts", { method: "POST", body: JSON.stringify(body) }),
  },
  categories: {
    list: () => authorizedFetch("/api/categories"),
  },
  transactions: {
    list: () => authorizedFetch("/api/transactions"),
    create: (body: unknown) => authorizedFetch("/api/transactions", { method: "POST", body: JSON.stringify(body) }),
  },
  savingsGoals: {
    list: () => authorizedFetch("/api/savings-goals"),
  },
  savingsContributions: {
    create: (body: unknown) => authorizedFetch("/api/savings-contributions", { method: "POST", body: JSON.stringify(body) }),
  },
  financialGoals: {
    list: () => authorizedFetch("/api/financial-goals"),
  },
  budgets: {
    list: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set("month", String(month));
      if (year) params.set("year", String(year));
      return authorizedFetch(`/api/budgets${params.size ? `?${params}` : ""}`);
    },
  },
};
