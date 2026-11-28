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
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/auth" &&
        window.location.pathname !== "/"
      ) {
        window.location.replace("/auth");
      }
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
  preferences: {
    get: () =>
      authorizedFetch("/api/preferences") as Promise<{
        preferences: {
          expenseLayout?: "transactions_first" | "categories_first";
          transactionDisplay?: "pagination" | "infinite";
          pageSize?: 25 | 50 | 100;
          defaultSort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
          defaultCategorySort?:
            | "manual"
            | "spent_desc"
            | "spent_asc"
            | "remaining_desc"
            | "remaining_asc"
            | "name_asc"
            | "name_desc";
        };
      }>,
    update: (body: {
      expenseLayout?: "transactions_first" | "categories_first";
      transactionDisplay?: "pagination" | "infinite";
      pageSize?: 25 | 50 | 100;
      defaultSort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
      defaultCategorySort?:
        | "manual"
        | "spent_desc"
        | "spent_asc"
        | "remaining_desc"
        | "remaining_asc"
        | "name_asc"
        | "name_desc";
    }) =>
      authorizedFetch("/api/preferences", { method: "PUT", body: JSON.stringify(body) }),
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
    reorder: (items: Array<{ id: string; sort_order: number; is_pinned: boolean }>) =>
      authorizedFetch("/api/categories/reorder", {
        method: "PUT",
        body: JSON.stringify({ items }),
      }) as Promise<{ updated: number }>,
  },
  transactions: {
    list: () => authorizedFetch("/api/transactions"),
    query: (params: {
      page?: number;
      pageSize?: number;
      search?: string;
      startDate?: string;
      endDate?: string;
      categoryId?: string;
      accountId?: string;
      type?: string;
      sort?: string;
    }) => {
      const searchParams = new URLSearchParams({ paginated: "1" });
      if (params.page) searchParams.set("page", String(params.page));
      if (params.pageSize) searchParams.set("pageSize", String(params.pageSize));
      if (params.search) searchParams.set("search", params.search);
      if (params.startDate) searchParams.set("startDate", params.startDate);
      if (params.endDate) searchParams.set("endDate", params.endDate);
      if (params.categoryId) searchParams.set("categoryId", params.categoryId);
      if (params.accountId) searchParams.set("accountId", params.accountId);
      if (params.type) searchParams.set("type", params.type);
      if (params.sort) searchParams.set("sort", params.sort);
      return authorizedFetch(`/api/transactions?${searchParams}`) as Promise<{
        items: import("@/lib/database-types").Transaction[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
      }>;
    },
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
