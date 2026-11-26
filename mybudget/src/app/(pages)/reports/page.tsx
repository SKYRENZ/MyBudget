import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { TrendChart } from "@/components/reports/TrendChart";

export default function ReportsPage() {
  return <Container>
    <PageHeader eyebrow="Financial intelligence" title="Reports" description="Understand your patterns, compare progress and find opportunities to improve." actions={<><ActionButton primary>Export PDF</ActionButton><ActionButton>Export CSV</ActionButton><ActionButton>Print report</ActionButton></>} />
    <div className="mt-6 grid gap-4 lg:grid-cols-3"><section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]"><div className="flex justify-between"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Six-month view</p><h2 className="mt-1 font-display text-xl font-bold">Cash flow trend</h2></div><div className="flex gap-3 text-xs"><span>● Income</span><span className="text-ember-deep">● Expenses</span><span className="text-[#7a8462]">● Savings</span></div></div><TrendChart /></section>
      <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Monthly summary</p><p className="mt-5 text-4xl font-bold">$5,870</p><p className="text-sm text-ink-soft">Total income</p><div className="mt-6 border-t border-ink/10 pt-5 space-y-4 text-sm"><div className="flex justify-between"><span>Expenses</span><b>$3,412</b></div><div className="flex justify-between"><span>Saved</span><b>$2,458</b></div><div className="flex justify-between"><span>Savings rate</span><b>41.9%</b></div></div></section></div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[["Spending","3.8% lower","vs last month","positive"],["Savings rate","+6.2 points","vs last month","positive"],["Top category","Housing","26% of spending","neutral"],["Goal progress","31% complete","Across all goals","neutral"]].map(([label,value,note,tone])=> <section key={label} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{label}</p><p className={`mt-4 text-xl font-bold ${tone==="positive"?"text-emerald-700":""}`}>{value}</p><p className="mt-1 text-xs text-ink-soft">{note}</p></section>)}</div>
  </Container>;
}
