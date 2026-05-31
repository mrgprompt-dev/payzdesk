"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface ReportMetric {
	total: number;
	count: number;
}

interface FinanceReport {
	deposits: ReportMetric;
	withdrawals: ReportMetric;
	securityDeposits: ReportMetric;
	securityWithdrawals: ReportMetric;
	commissionsReleased: ReportMetric;
	adjustments: {
		credit: ReportMetric;
		debit: ReportMetric;
		net: number;
	};
}

function formatINR(value: number) {
	return `₹${value.toLocaleString("en-IN")}`;
}

export default function AdminReportsPage() {
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [agentId, setAgentId] = useState("");

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["admin-finance-report", from, to, agentId],
		queryFn: async () => {
			const res = await axios.get("/api/admin/reports/finance", {
				params: { from, to, agentId },
			});
			return res.data.data as FinanceReport;
		},
	});

	const exportUrl = `/api/admin/reports/finance/export?${new URLSearchParams({
		...(from ? { from } : {}),
		...(to ? { to } : {}),
		...(agentId ? { agentId } : {}),
	}).toString()}`;

	const rows = data
		? [
				["Deposits", data.deposits],
				["Withdrawals", data.withdrawals],
				["Security Deposits", data.securityDeposits],
				["Security Withdrawals", data.securityWithdrawals],
				["Commissions Released", data.commissionsReleased],
				["Adjustment Credits", data.adjustments.credit],
				["Adjustment Debits", data.adjustments.debit],
			]
		: [];

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Finance Reports</h1>
				<Button variant="secondary" onClick={() => window.open(exportUrl, "_blank")}>
					Export CSV
				</Button>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
					<Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
					<Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
					<Input
						label="Agent ID"
						placeholder="Optional ObjectId"
						value={agentId}
						onChange={(e) => setAgentId(e.target.value)}
					/>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading report. {error instanceof Error ? error.message : ""}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Metric</th>
									<th className="pb-3 font-medium">Count</th>
									<th className="pb-3 font-medium text-right">Total</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{rows.map(([label, metric]) => (
									<tr key={label as string}>
										<td className="py-3 text-foreground">{label as string}</td>
										<td className="py-3 text-muted">{(metric as ReportMetric).count}</td>
										<td className="py-3 text-right font-medium text-foreground">
											{formatINR((metric as ReportMetric).total)}
										</td>
									</tr>
								))}
								<tr>
									<td className="py-3 text-foreground">Adjustment Net</td>
									<td className="py-3 text-muted">-</td>
									<td className="py-3 text-right font-medium text-foreground">
										{formatINR(data?.adjustments.net || 0)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				)}
			</Card>
		</div>
	);
}
