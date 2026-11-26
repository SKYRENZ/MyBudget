export function clearLegacyAuthStorage() {
  if (typeof window === "undefined") return;
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

async function authorizedFetch(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    cache: "no-store",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    if (response.status === 401) {
      throw new Error(body?.error ?? "Please sign in to access your budget");
    }
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  auth: {
    session: () =>
      authorizedFetch("/api/auth/session") as Promise<{
        authenticated: boolean;
        user: { id: string; username: string } | null;
      }>,
    logout: () => authorizedFetch("/api/auth/logout", { method: "POST" }),
  },
  profile: {
    get: () =>
      authorizedFetch("/api/profile") as Promise<{
        id: string;
        full_name: string | null;
        username: string | null;
        is_new_user?: number | boolean | null;
      }>,
    update: (body: { full_name?: string; is_new_user?: number }) =>
      authorizedFetch("/api/profile", { method: "PUT", body: JSON.stringify(body) }),
  },
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
    contribute: (id: string, body: unknown) => authorizedFetch(`/api/financial-goals/${id}/contribute`, { method: "POST", body: JSON.stringify(body) }),
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
