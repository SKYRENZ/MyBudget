"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency, getCurrencySymbol, toStoredUsd } from "@/lib/currency";
import type { Account, Category, Transaction } from "@/lib/database-types";

function currentLocalDate() {
  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ExpensesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [transactionDate, setTransactionDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryBudget, setCategoryBudget] = useState("");
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetLimit, setBudgetLimit] = useState("");

  async function loadExpenses() {
    const [categoryRows, transactionRows, accountRows] = await Promise.all([
      api.categories.list(),
      api.transactions.list(),
      api.accounts.list(),
    ]);
    setCategories(categoryRows);
    setTransactions(transactionRows);
    setAccounts(accountRows);
  }

  useEffect(() => {
    Promise.all([api.categories.list(), api.transactions.list(), api.accounts.list()])
      .then(([categoryRows, transactionRows, accountRows]) => {
        setCategories(categoryRows);
        setTransactions(transactionRows);
        setAccounts(accountRows);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "Could not load expenses"),
      );
  }, []);

  async function submitExpense() {
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError("Enter a description and an amount greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.transactions.create({
        type: "expense",
        description: description.trim(),
        amount: toStoredUsd(numericAmount),
        category_id: categoryId || null,
        account_id: accountId || null,
        transaction_date: transactionDate || currentLocalDate(),
        notes: null,
      });
      setDescription("");
      setAmount("");
      setCategoryId("");
      setAccountId("");
      setShowExpenseForm(false);
      await loadExpenses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add expense");
    } finally {
      setSaving(false);
    }
  }

  async function submitIncome() {
    const numericAmount = Number(amount);
    if (!description.trim() || !numericAmount || numericAmount <= 0) {
      setError("Enter a description and an income amount greater than zero.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.transactions.create({
        type: "income",
        description: description.trim(),
        amount: toStoredUsd(numericAmount),
        category_id: null,
        account_id: accountId || null,
        transaction_date: transactionDate || currentLocalDate(),
        notes: null,
      });
      setDescription("");
      setAmount("");
      setAccountId("");
      setShowIncomeForm(false);
      await loadExpenses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add income");
    } finally {
      setSaving(false);
    }
  }

  async function submitCategory() {
    const numericBudget = Number(categoryBudget);
    if (!categoryName.trim()) {
      setError("Enter a category name.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api.categories.create({
        name: categoryName.trim(),
        monthly_budget: numericBudget >= 0 ? toStoredUsd(numericBudget) : 0,
        icon: null,
        color: "#D97706",
      });
      setCategoryName("");
      setCategoryBudget("");
      setShowCategoryForm(false);
      await loadExpenses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not add category");
    } finally {
      setSaving(false);
    }
  }

  async function submitBudgets() {
    const numericLimit = Number(budgetLimit);
    if (!budgetCategoryId || !numericLimit || numericLimit <= 0) {
      setError("Select a category and enter a positive budget limit.");
      return;
    }
    const now = new Date();
    setSaving(true);
    setError("");
    try {
      await api.budgets.create({
        category_id: budgetCategoryId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        limit_amount: toStoredUsd(numericLimit),
      });
      setBudgetCategoryId("");
      setBudgetLimit("");
      setShowBudgetForm(false);
      await loadExpenses();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update budget");
    } finally {
      setSaving(false);
    }
  }

  async function importCsv(file: File) {
    setSaving(true);
    setError("");
    try {
      const text = await file.text();
      const [headerLine, ...lines] = text.trim().split(/\r?\n/);
      const headers = headerLine.split(",").map((item) => item.trim().toLowerCase().replace(/^"|"$/g, ""));
      let imported = 0;
      for (const line of lines) {
        if (!line.trim()) continue;
        const values = line.split(",").map((item) => item.trim().replace(/^"|"$/g, ""));
        const get = (name: string) => values[headers.indexOf(name)] ?? "";
        const numericAmount = Number(get("amount"));
        if (!numericAmount || numericAmount <= 0) continue;
        await api.transactions.create({
          type: get("type") === "income" ? "income" : "expense",
          description: get("description") || get("name") || "Imported transaction",
          amount: toStoredUsd(numericAmount),
          account_id: get("account_id") || accountId || null,
          category_id: get("category_id") || categoryId || null,
          transaction_date: get("date") || get("transaction_date") || transactionDate || currentLocalDate(),
          notes: get("notes") || null,
        });
        imported += 1;
      }
      setShowImportForm(false);
      await loadExpenses();
      setError(imported ? "" : "No valid transactions were found in the CSV.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not import CSV");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Container>
      <PageHeader eyebrow="Cash flow" title="Expenses" description="Track spending, manage category limits and keep every account in balance." actions={<><ActionButton primary onClick={() => setShowExpenseForm(true)}>+ Add expense</ActionButton><ActionButton onClick={() => setShowIncomeForm(true)}>+ Add income</ActionButton><ActionButton onClick={() => setShowCategoryForm(true)}>+ Add category</ActionButton><ActionButton onClick={() => setShowBudgetForm(true)}>Edit budget limits</ActionButton><ActionButton onClick={() => setShowImportForm(true)}>Import CSV</ActionButton></>} />
      {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const spent = transactions
            .filter((row) => row.type === "expense" && row.category_id === category.id)
            .reduce((sum, row) => sum + Number(row.amount), 0);
          const limit = Number(category.monthly_budget);
          const percent = limit > 0 ? Math.round(spent / limit * 100) : 0;
          return <section key={category.id} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><div className="flex justify-between"><h2 className="font-display text-lg font-bold">{category.name}</h2><span className="text-xs font-bold">{percent}%</span></div><div className="mt-5 h-1.5 bg-ink/10"><div className="h-full bg-ember-deep" style={{width:`${Math.min(percent,100)}%`}} /></div><div className="mt-4 grid grid-cols-2 text-xs"><div><p className="text-ink-soft">Spent</p><b>{formatCurrency(spent)}</b></div><div className="text-right"><p className="text-ink-soft">Remaining</p><b>{formatCurrency(limit-spent)}</b></div></div><p className="mt-3 border-t border-ink/10 pt-3 text-[0.65rem] text-ink-soft">Limit {formatCurrency(limit)}</p></section>;
        })}
        {categories.length === 0 && !error ? <p className="text-sm text-ink-soft">No categories or expenses yet.</p> : null}
      </div>
      <section className="mt-6 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"><div className="border-b border-ink/15 p-5"><h2 className="font-display text-xl font-bold">Transactions</h2></div><div className="overflow-x-auto"><table className="w-full min-w-162.5 text-left text-sm"><thead className="text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft"><tr><td className="px-5 py-3">Description</td><td>Type</td><td>Category</td><td>Account</td><td>Date</td><td className="px-5 text-right">Amount</td></tr></thead><tbody>{transactions.map((row)=><tr key={row.id} className="border-t border-ink/10"><td className="px-5 py-4 font-bold">{row.description || (row.type === "income" ? "Income" : "Expense")}</td><td className="uppercase text-[0.62rem] tracking-[0.12em] text-ink-soft">{row.type}</td><td>{row.categories?.name || "—"}</td><td>{row.accounts?.name || "—"}</td><td>{row.transaction_date}</td><td className="px-5 text-right font-bold">{row.type === "income" ? "+" : row.type === "expense" ? "−" : ""}{formatCurrency(Number(row.amount))}</td></tr>)}</tbody></table>{transactions.length===0&&!error?<p className="p-5 text-sm text-ink-soft">No transactions yet.</p>:null}</div></section>
      {showExpenseForm ? (
        <div
          className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowExpenseForm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="expense-dialog-title"
            className="max-h-[92svh] w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-2xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-ink/15 bg-paper px-5 py-4 dark:border-white/10 dark:bg-[#211b17] sm:px-6">
              <div>
                <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">New transaction</p>
                <h2 id="expense-dialog-title" className="mt-1 font-display text-2xl font-bold">Add expense</h2>
              </div>
              <button type="button" aria-label="Close expense form" onClick={() => setShowExpenseForm(false)} className="grid size-9 shrink-0 place-items-center border border-ink/15 text-xl leading-none text-ink-soft hover:border-ink hover:text-ink dark:text-[#cfc2af]">×</button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Description</span><input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Groceries, rent, utilities…" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Amount</span><div className="mt-2 flex border border-ink/15 focus-within:border-ember-deep"><span className="grid w-10 place-items-center border-r border-ink/15 text-sm text-ink-soft">{getCurrencySymbol()}</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /></div></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Date</span><input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Category</span><select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep dark:bg-[#211b17]"><option value="">No category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Account</span><select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none focus:border-ember-deep dark:bg-[#211b17]"><option value="">No account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            </div>

            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}

            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 dark:border-white/10 sm:px-6">
              <ActionButton onClick={() => setShowExpenseForm(false)}>Cancel</ActionButton>
              <ActionButton primary onClick={submitExpense}>{saving ? "Saving…" : "Add expense"}</ActionButton>
            </div>
          </section>
        </div>
      ) : null}

      {showIncomeForm ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowIncomeForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="income-dialog-title" className="max-h-[92svh] w-full overflow-y-auto border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-xl sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Money in</p><h2 id="income-dialog-title" className="mt-1 font-display text-2xl font-bold">Add income</h2></div><button type="button" aria-label="Close income form" onClick={() => setShowIncomeForm(false)} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Description</span><input autoFocus value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Salary, freelance, refund…" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Amount</span><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Date</span><input type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Account</span><select value={accountId} onChange={(event) => setAccountId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none dark:bg-[#211b17]"><option value="">No account</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
            </div>
            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={() => setShowIncomeForm(false)}>Cancel</ActionButton><ActionButton primary onClick={submitIncome}>{saving ? "Saving…" : "Add income"}</ActionButton></div>
          </section>
        </div>
      ) : null}

      {showCategoryForm ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCategoryForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="category-dialog-title" className="w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Organization</p><h2 id="category-dialog-title" className="mt-1 font-display text-2xl font-bold">Add category</h2></div><button type="button" aria-label="Close category form" onClick={() => setShowCategoryForm(false)} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Category name</span><input autoFocus value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="Pets, gifts, childcare…" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
              <label className="block sm:col-span-2"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Monthly budget</span><input type="number" min="0" step="0.01" value={categoryBudget} onChange={(event) => setCategoryBudget(event.target.value)} placeholder="0.00" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
            </div>
            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={() => setShowCategoryForm(false)}>Cancel</ActionButton><ActionButton primary onClick={submitCategory}>{saving ? "Saving…" : "Add category"}</ActionButton></div>
          </section>
        </div>
      ) : null}

      {showBudgetForm ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowBudgetForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="budget-dialog-title" className="w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-ember-deep">Monthly planning</p><h2 id="budget-dialog-title" className="mt-1 font-display text-2xl font-bold">Edit budget limits</h2></div><button type="button" aria-label="Close budget form" onClick={() => setShowBudgetForm(false)} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>
            <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Category</span><select value={budgetCategoryId} onChange={(event) => setBudgetCategoryId(event.target.value)} className="mt-2 w-full border border-ink/15 bg-paper px-3 py-3 text-sm outline-none dark:bg-[#211b17]"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="block"><span className="text-[0.62rem] font-bold uppercase tracking-[0.14em] text-ink-soft">Limit</span><input type="number" min="0.01" step="0.01" value={budgetLimit} onChange={(event) => setBudgetLimit(event.target.value)} placeholder="0.00" className="mt-2 w-full border border-ink/15 bg-transparent px-3 py-3 text-sm outline-none focus:border-ember-deep" /></label>
            </div>
            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end gap-2 border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={() => setShowBudgetForm(false)}>Cancel</ActionButton><ActionButton primary onClick={submitBudgets}>{saving ? "Saving…" : "Save limit"}</ActionButton></div>
          </section>
        </div>
      ) : null}

      {showImportForm ? (
        <div className="fixed inset-0 z-70 flex items-end justify-center bg-ink/35 backdrop-blur-[2px] sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowImportForm(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="import-dialog-title" className="w-full border border-ink/15 bg-paper shadow-[12px_12px_0_rgba(61,31,12,0.18)] sm:max-w-lg sm:border-2 dark:border-white/10 dark:bg-[#211b17]">
            <div className="flex items-start justify-between border-b border-ink/15 px-5 py-4 sm:px-6"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.14em] text-ember-deep">CSV import</p><h2 id="import-dialog-title" className="mt-1 font-display text-2xl font-bold">Import transactions</h2></div><button type="button" aria-label="Close CSV import" onClick={() => setShowImportForm(false)} className="grid size-9 place-items-center border border-ink/15 text-xl text-ink-soft">×</button></div>
            <div className="p-5 sm:p-6"><p className="text-sm leading-6 text-ink-soft">Use columns: <b>description, amount, type, date, category_id, account_id</b>. The type may be <b>expense</b> or <b>income</b>.</p><input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; if (file) void importCsv(file); }} className="mt-5 block w-full border border-ink/15 px-3 py-3 text-sm file:mr-4 file:border-0 file:bg-ember-deep file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:text-white" /></div>
            {error ? <p className="mx-5 mb-4 border border-red-700/20 bg-red-50 px-3 py-2 text-sm text-red-800 sm:mx-6">{error}</p> : null}
            <div className="flex justify-end border-t border-ink/15 px-5 py-4 sm:px-6"><ActionButton onClick={() => setShowImportForm(false)}>Close</ActionButton></div>
          </section>
        </div>
      ) : null}
    </Container>
  );
}
