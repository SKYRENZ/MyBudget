"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

export default function ReportsPage() {
  const [data,setData]=useState<any>(null);
  const [error,setError]=useState("");
  useEffect(()=>{api.dashboard().then(setData).catch((reason)=>setError(reason instanceof Error?reason.message:"Could not load reports"));},[]);
  const transactions=data?.transactions||[];
  const income=transactions.filter((row:any)=>row.type==="income").reduce((sum:number,row:any)=>sum+Number(row.amount),0);
  const expenses=transactions.filter((row:any)=>row.type==="expense").reduce((sum:number,row:any)=>sum+Number(row.amount),0);
  const savings=Math.max(income-expenses,0);
  return <Container>
    <PageHeader eyebrow="Financial intelligence" title="Reports" description="Understand your patterns, compare progress and find opportunities to improve." actions={<><ActionButton primary>Export PDF</ActionButton><ActionButton>Export CSV</ActionButton><ActionButton>Print report</ActionButton></>} />
    {error?<p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p>:null}
    <div className="mt-6 grid gap-4 lg:grid-cols-3">
      <section className="border border-ink/15 bg-paper p-5 lg:col-span-2 dark:border-white/10 dark:bg-[#211b17]">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Transaction summary</p>
        <h2 className="mt-1 font-display text-xl font-bold">Income and expenses</h2>
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="border-l-2 border-ink pl-4">
            <p className="text-xs text-ink-soft">Income</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(income)}</p>
          </div>
          <div className="border-l-2 border-ember-deep pl-4">
            <p className="text-xs text-ink-soft">Expenses</p>
            <p className="mt-2 text-2xl font-bold">{formatCurrency(expenses)}</p>
          </div>
        </div>
      </section>
      <section className="border border-ink/15 bg-paper p-5 dark:border-white/10 dark:bg-[#211b17]">
        <p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">Available position</p>
        <p className="mt-5 text-4xl font-bold">{formatCurrency(savings)}</p>
        <p className="text-sm text-ink-soft">Income less recorded expenses</p>
      </section>
    </div>
    {data&&!transactions.length?<p className="mt-5 text-sm text-ink-soft">No report transactions yet.</p>:null}
  </Container>;
}
