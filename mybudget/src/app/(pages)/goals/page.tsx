import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { formatCurrency } from "@/lib/currency";

const goals = [
	[
		"Emergency fund",
		"Family safety reserve",
		9000,
		6200,
		"High",
		"Jun 2027",
	],
	[
		"Family vacation",
		"Summer trip together",
		3000,
		1850,
		"Medium",
		"Jul 2026",
	],
	[
		"New vehicle",
		"Reliable family transport",
		28000,
		7400,
		"Medium",
		"Dec 2028",
	],
	[
		"Home renovation",
		"Kitchen and living area",
		15000,
		2800,
		"Low",
		"Mar 2029",
	],
	[
		"Retirement",
		"Long-term independence",
		250000,
		42000,
		"High",
		"Dec 2045",
	],
] as const;

export default function GoalsPage() {
	return (
		<Container>
			<PageHeader
				eyebrow="Long-term planning"
				title="Goals"
				description="Turn major ambitions into dated, measurable plans."
				actions={
					<>
						<ActionButton primary>Create goal</ActionButton>
						<ActionButton>Mark complete</ActionButton>
					</>
				}
			/>
			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				{goals.map(
					([name, description, target, current, priority, deadline]) => {
						const percent = Math.round((current / target) * 100);
						return (
							<section
								key={name}
								className="border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
											{priority} priority
										</p>
										<h2 className="mt-2 font-display text-2xl font-bold">
											{name}
										</h2>
										<p className="mt-2 text-sm text-ink-soft dark:text-[#cfc2af]">
											{description}
										</p>
									</div>
									<button className="text-xs">•••</button>
								</div>
								<div className="mt-6 flex items-end justify-between">
									<p className="text-2xl font-bold">
										{formatCurrency(current)}
									</p>
									<p className="text-sm text-ink-soft">
										of {formatCurrency(target)}
									</p>
								</div>
								<div className="mt-3 h-2 bg-ink/10">
									<div
										className="h-full bg-ember-deep"
										style={{ width: `${percent}%` }}
									/>
								</div>
								<div className="mt-5 grid grid-cols-3 border-t border-ink/10 pt-4 text-xs">
									<div>
										<p className="text-ink-soft">Progress</p>
										<p className="mt-1 font-bold">{percent}%</p>
									</div>
									<div>
										<p className="text-ink-soft">Deadline</p>
										<p className="mt-1 font-bold">{deadline}</p>
									</div>
									<div className="text-right">
										<p className="text-ink-soft">Required/month</p>
										<p className="mt-1 font-bold">
											{formatCurrency(Math.max(0, (target - current) / 24))}
										</p>
									</div>
								</div>
							</section>
						);
					}
				)}
			</div>
		</Container>
	);
}
