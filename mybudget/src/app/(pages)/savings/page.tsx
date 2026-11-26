import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { savingsGoals } from "@/content/dashboard";
import { formatCurrency, formatPercent } from "@/lib/currency";

export default function SavingsPage() {
  return <Container>
    <PageHeader eyebrow="Future funds" title="Savings" description="Build reserves and turn monthly contributions into visible progress." actions={<><ActionButton primary>Add contribution</ActionButton><ActionButton>Create savings goal</ActionButton></>} />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {savingsGoals.map((goal) => {
        const percent = Math.round((goal.saved / goal.target) * 100);
        return <section key={goal.name} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><div className="flex justify-between"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Savings goal</p><button className="text-xs">•••</button></div><h2 className="mt-3 font-display text-2xl font-bold">{goal.name}</h2><p className="mt-6 text-3xl font-bold">{formatCurrency(goal.saved)}</p><p className="mt-1 text-xs text-ink-soft">of {formatCurrency(goal.target)} · {formatPercent(goal.saved, goal.target)}</p><div className="mt-5 h-2 bg-ink/10"><div className="h-full bg-ember-deep" style={{width:`${Math.min(percent,100)}%`}} /></div><div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs"><div><p className="text-ink-soft">Monthly</p><p className="mt-1 font-bold">{formatCurrency(goal.monthly)}</p></div><div className="text-right"><p className="text-ink-soft">Remaining</p><p className="mt-1 font-bold">{formatCurrency(goal.target-goal.saved)}</p></div></div></section>;
      })}
    </div>
  </Container>;
}
