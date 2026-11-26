"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { Category, Transaction } from "@/lib/database-types";

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.categories.list(), api.transactions.list()])
      .then(([categoryRows, transactionRows]) => {
        setCategories(categoryRows);
        setTransactions(transactionRows.filter((row: Transaction) => row.type === "expense"));
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load expenses"));
  }, []);

  return (
    <Container>
      <PageHeader eyebrow="Cash flow" title="Expenses" description="Track spending, manage category limits and keep every account in balance." actions={<><ActionButton primary>+ Add expense</ActionButton><ActionButton>+ Add income</ActionButton><ActionButton>+ Add category</ActionButton><ActionButton>Edit budget limits</ActionButton><ActionButton>Import CSV</ActionButton></>} />
      {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const spent = transactions.filter((row) => row.category_id === category.id).reduce((sum, row) => sum + Number(row.amount), 0);
          const limit = Number(category.monthly_budget);
          const percent = limit > 0 ? Math.round(spent / limit * 100) : 0;
          return <section key={category.id} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><div className="flex justify-between"><h2 className="font-display text-lg font-bold">{category.name}</h2><span className="text-xs font-bold">{percent}%</span></div><div className="mt-5 h-1.5 bg-ink/10"><div className="h-full bg-ember-deep" style={{width:`${Math.min(percent,100)}%`}} /></div><div className="mt-4 grid grid-cols-2 text-xs"><div><p className="text-ink-soft">Spent</p><b>{formatCurrency(spent)}</b></div><div className="text-right"><p className="text-ink-soft">Remaining</p><b>{formatCurrency(limit-spent)}</b></div></div><p className="mt-3 border-t border-ink/10 pt-3 text-[0.65rem] text-ink-soft">Limit {formatCurrency(limit)}</p></section>;
        })}
        {categories.length === 0 && !error ? <p className="text-sm text-ink-soft">No categories or expenses yet.</p> : null}
      </div>
      <section className="mt-6 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"><div className="border-b border-ink/15 p-5"><h2 className="font-display text-xl font-bold">Transactions</h2></div><div className="overflow-x-auto"><table className="w-full min-w-162.5 text-left text-sm"><thead className="text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft"><tr><td className="px-5 py-3">Description</td><td>Category</td><td>Account</td><td>Date</td><td className="px-5 text-right">Amount</td></tr></thead><tbody>{transactions.map((row)=><tr key={row.id} className="border-t border-ink/10"><td className="px-5 py-4 font-bold">{row.description || "Expense"}</td><td>{row.categories?.name || "—"}</td><td>{row.accounts?.name || "—"}</td><td>{row.transaction_date}</td><td className="px-5 text-right font-bold">−{formatCurrency(Number(row.amount))}</td></tr>)}</tbody></table>{transactions.length===0&&!error?<p className="p-5 text-sm text-ink-soft">No expense transactions yet.</p>:null}</div></section>
    </Container>
  );
}
