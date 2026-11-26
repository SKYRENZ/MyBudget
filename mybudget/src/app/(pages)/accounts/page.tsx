import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatCurrency } from "@/lib/currency";

const accounts = [
  ["Everyday checking","Bank account",7420,"Nov 28","bg-ink"],
  ["Emergency reserve","Savings account",6200,"Nov 26","bg-[#64705a]"],
  ["Family cash","Cash",840,"Nov 25","bg-ember-deep"],
  ["Rewards credit card","Credit card",-1240,"Nov 28","bg-[#8c3f32]"],
  ["GCash","E-wallet",1150,"Nov 27","bg-[#2879ae]"],
  ["Maya","E-wallet",680,"Nov 24","bg-[#315e52]"],
] as const;

export default function AccountsPage() {
  return <Container>
    <PageHeader eyebrow="Money locations" title="Accounts" description="Monitor balances across banking, cash and digital wallets." actions={<><ActionButton primary>Add account</ActionButton><ActionButton>Transfer funds</ActionButton></>} />
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {accounts.map(([name,type,balance,last,accent]) => <section key={name} className="overflow-hidden border border-ink/15 bg-paper dark:border-white/10 dark:bg-[#211b17]"><div className={`h-2 ${accent}`} /><div className="p-5 sm:p-6"><div className="flex items-start justify-between"><div><p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ink-soft">{type}</p><h2 className="mt-2 font-display text-xl font-bold">{name}</h2></div><button className="text-xs">•••</button></div><p className="mt-8 text-3xl font-bold">{formatCurrency(balance)}</p><p className="mt-2 border-t border-ink/10 pt-3 text-xs text-ink-soft">Last activity · {last}</p></div></section>)}
    </div>
  </Container>;
}
