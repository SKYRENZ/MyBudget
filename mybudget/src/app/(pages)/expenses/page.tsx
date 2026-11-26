import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { initialMonths } from "@/content/dashboard";
import { formatCurrency } from "@/lib/currency";

const month = initialMonths.at(-1)!;

export default function ExpensesPage() {
  return (
    <Container>
      <PageHeader eyebrow="Cash flow" title="Expenses" description="Track spending, manage category limits and keep every account in balance." actions={
        <><ActionButton primary>+ Add expense</ActionButton><ActionButton>+ Add income</ActionButton><ActionButton>+ Add category</ActionButton><ActionButton>Edit budget limits</ActionButton><ActionButton>Import CSV</ActionButton></>
      } />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {month.categories.map((category) => {
          const remaining = category.budget - category.spent;
          const percent = Math.round((category.spent / category.budget) * 100);
          return (
            <section key={category.name} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
              <div className="flex items-start justify-between gap-3"><h2 className="font-display text-lg font-bold">{category.name}</h2><span className="text-xs font-bold">{percent}%</span></div>
              <div className="mt-5 h-1.5 bg-ink/10"><div className="h-full bg-ember-deep" style={{ width: `${Math.min(percent, 100)}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-ink-soft dark:text-[#cfc2af]">Spent</p><p className="mt-1 font-bold">{formatCurrency(category.spent)}</p></div><div className="text-right"><p className="text-ink-soft dark:text-[#cfc2af]">Remaining</p><p className="mt-1 font-bold">{formatCurrency(remaining)}</p></div></div>
              <p className="mt-3 border-t border-ink/10 pt-3 text-[0.65rem] text-ink-soft dark:text-[#cfc2af]">Limit {formatCurrency(category.budget)}</p>
            </section>
          );
        })}
      </div>

      <section className="mt-6 border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]">
        <div className="flex flex-col gap-3 border-b border-ink/15 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-xl font-bold">Recent transactions</h2>
          <div className="flex gap-2"><input aria-label="Search transactions" placeholder="Search" className="min-w-0 flex-1 border border-ink/15 bg-transparent px-3 py-2 text-sm outline-none sm:w-52" /><button className="border border-ink/15 px-3 py-2 text-xs">Filter</button></div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="text-[0.58rem] uppercase tracking-[0.16em] text-ink-soft"><tr><td className="px-5 py-3">Description</td><td>Category</td><td>Account</td><td>Date</td><td className="text-right">Amount</td></tr></thead><tbody>{[{d:"Apartment rent",c:"Housing",a:"Bank account",date:"Nov 28",n:-1450},{d:"Salary",c:"Income",a:"Bank account",date:"Nov 27",n:4800},{d:"Market Street Groceries",c:"Groceries",a:"Cash",date:"Nov 26",n:-86},{d:"Electric bill",c:"Utilities",a:"Bank account",date:"Nov 24",n:-64}].map((row)=><tr key={row.d} className="border-t border-ink/10"><td className="px-5 py-4 font-bold">{row.d}</td><td>{row.c}</td><td>{row.a}</td><td>{row.date}</td><td className={`px-5 text-right font-bold ${row.n > 0 ? "text-emerald-700" : ""}`}>{row.n > 0 ? "+" : ""}{formatCurrency(row.n)}</td></tr>)}</tbody></table></div>
      </section>
    </Container>
  );
}
