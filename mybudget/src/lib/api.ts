import { supabase } from "@/lib/supabase";

async function authorizedFetch(path: string, init?: RequestInit) {
  if (!supabase) throw new Error("Supabase is not configured");

  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in to access your budget");

  const response = await fetch(path, {
    ...init,
    cache: "no-store",
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
    update: (id: string, body: unknown) => authorizedFetch(`/api/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => authorizedFetch(`/api/accounts/${id}`, { method: "DELETE" }),
    transfer: (body: unknown) => authorizedFetch("/api/transfers", { method: "POST", body: JSON.stringify(body) }),
  },
  categories: {
    list: () => authorizedFetch("/api/categories"),
    create: (body: unknown) => authorizedFetch("/api/categories", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => authorizedFetch(`/api/categories/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  },
  transactions: {
    list: () => authorizedFetch("/api/transactions"),
    create: (body: unknown) => authorizedFetch("/api/transactions", { method: "POST", body: JSON.stringify(body) }),
  },
  savingsGoals: {
    list: () => authorizedFetch("/api/savings-goals"),
    create: (body: unknown) => authorizedFetch("/api/savings-goals", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => authorizedFetch(`/api/savings-goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => authorizedFetch(`/api/savings-goals/${id}`, { method: "DELETE" }),
  },
  savingsContributions: {
    create: (body: unknown) => authorizedFetch("/api/savings-contributions", { method: "POST", body: JSON.stringify(body) }),
  },
  financialGoals: {
    list: () => authorizedFetch("/api/financial-goals"),
    create: (body: unknown) => authorizedFetch("/api/financial-goals", { method: "POST", body: JSON.stringify(body) }),
    update: (id: string, body: unknown) => authorizedFetch(`/api/financial-goals/${id}`, { method: "PUT", body: JSON.stringify(body) }),
    delete: (id: string) => authorizedFetch(`/api/financial-goals/${id}`, { method: "DELETE" }),
  },
  budgets: {
    create: (body: unknown) => authorizedFetch("/api/budgets", { method: "POST", body: JSON.stringify(body) }),
    list: (month?: number, year?: number) => {
      const params = new URLSearchParams();
      if (month) params.set("month", String(month));
      if (year) params.set("year", String(year));
      return authorizedFetch(`/api/budgets${params.size ? `?${params}` : ""}`);
    },
  },
};
