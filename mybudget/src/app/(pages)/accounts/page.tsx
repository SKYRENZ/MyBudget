"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

export default function AccountsPage() {
  const [accounts,setAccounts]=useState<any[]>([]);
  const [error,setError]=useState("");
  useEffect(()=>{ api.accounts.list().then(setAccounts).catch((reason)=>setError(reason instanceof Error?reason.message:"Could not load accounts")); },[]);
  return <Container>
    <PageHeader eyebrow="Money locations" title="Accounts" description="Monitor balances across banking, cash and digital wallets." actions={<><ActionButton primary>Add account</ActionButton><ActionButton>Transfer funds</ActionButton></>} />
    {error?<p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">{error}</p>:null}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map((account)=>{const accent=account.color||"#b85f24";return <section key={account.id} className="overflow-hidden border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"><div className="h-2" style={{backgroundColor:accent}}/><div className="p-5 sm:p-6"><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{account.type}</p><h2 className="mt-2 font-display text-xl font-bold">{account.name}</h2><p className="mt-8 text-3xl font-bold">{formatCurrency(Number(account.balance))}</p><p className="mt-2 border-t border-ink/10 pt-3 text-xs text-ink-soft">Created {new Date(account.created_at).toLocaleDateString()}</p></div></section>;})}
      {accounts.length===0&&!error?<p className="text-sm text-ink-soft">No accounts yet.</p>:null}
    </div>
  </Container>;
}
