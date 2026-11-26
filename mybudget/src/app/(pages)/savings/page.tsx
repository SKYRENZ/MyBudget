"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { SavingsGoal } from "@/lib/database-types";

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api.savingsGoals.list().then(setGoals).catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load savings"));
  }, []);

  return <Container>
    <PageHeader eyebrow="Future funds" title="Savings" description="Build reserves and turn monthly contributions into visible progress." actions={<><ActionButton primary>Add contribution</ActionButton><ActionButton>Create savings goal</ActionButton></>} />
    {error ? <p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p> : null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {goals.map((goal) => {
        const target=Number(goal.target_amount);
        const saved=Number(goal.current_amount);
        const percent=target>0?Math.round(saved/target*100):0;
        return <section key={goal.id} className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Savings goal</p><h2 className="mt-3 font-display text-2xl font-bold">{goal.name}</h2><p className="mt-6 text-3xl font-bold">{formatCurrency(saved)}</p><p className="mt-1 text-xs text-ink-soft">of {formatCurrency(target)} · {percent}%</p><div className="mt-5 h-2 bg-ink/10"><div className="h-full bg-ember-deep" style={{width:`${Math.min(percent,100)}%`}} /></div><div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs"><div><p className="text-ink-soft">Monthly</p><p className="mt-1 font-bold">{formatCurrency(Number(goal.monthly_contribution))}</p></div><div className="text-right"><p className="text-ink-soft">Remaining</p><p className="mt-1 font-bold">{formatCurrency(Math.max(target-saved,0))}</p></div></div></section>;
      })}
      {goals.length===0&&!error?<p className="text-sm text-ink-soft">No savings goals yet.</p>:null}
    </div>
  </Container>;
}
