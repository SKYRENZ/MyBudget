"use client";

import { useEffect, useState } from "react";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { ActionButton } from "@/components/ui/ActionButton";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";
import type { FinancialGoal } from "@/lib/database-types";

export default function GoalsPage() {
	const [goals, setGoals] = useState<FinancialGoal[]>([]);
	const [error, setError] = useState("");
	useEffect(() => {
		api.financialGoals
			.list()
			.then(setGoals)
			.catch((reason) =>
				setError(
					reason instanceof Error ? reason.message : "Could not load goals"
				)
			);
	}, []);
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
			{error ? (
				<p className="mt-6 border border-ember-deep/30 bg-paper p-4 text-sm text-ember-deep">
					{error}
				</p>
			) : null}
			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				{goals.map((goal) => {
					const target = Number(goal.target_amount || 0);
					const percent = target > 0 ? 0 : 0;
					return (
						<section
							key={goal.id}
							className="border border-ink/15 bg-paper p-5 sm:p-6 dark:border-white/10 dark:bg-[#211b17]"
						>
							<p className="text-[0.58rem] font-bold uppercase tracking-[0.16em] text-ember-deep">
								{goal.priority} priority
							</p>
							<h2 className="mt-2 font-display text-2xl font-bold">
								{goal.name}
							</h2>
							<p className="mt-2 text-sm text-ink-soft">
								{goal.description || "No description"}
							</p>
							<div className="mt-6 flex justify-between">
								<p className="text-2xl font-bold">
									{formatCurrency(target)}
								</p>
								<p className="text-sm text-ink-soft">Target</p>
							</div>
							<div className="mt-3 h-2 bg-ink/10">
								<div
									className="h-full bg-ember-deep"
									style={{ width: `${percent}%` }}
								/>
							</div>
							<div className="mt-5 grid grid-cols-2 border-t border-ink/10 pt-4 text-xs">
								<div>
									<p className="text-ink-soft">Deadline</p>
									<p className="mt-1 font-bold">
										{goal.deadline || "Not set"}
									</p>
								</div>
								<div className="text-right">
									<p className="text-ink-soft">Status</p>
									<p className="mt-1 font-bold">{goal.status}</p>
								</div>
							</div>
						</section>
					);
				})}
				{goals.length === 0 && !error ? (
					<p className="text-sm text-ink-soft">
						No financial goals yet.
					</p>
				) : null}
			</div>
		</Container>
	);
}
