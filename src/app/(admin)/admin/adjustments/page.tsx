"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface Agent {
	_id: string;
	name: string;
	phone: string;
	netBalance: number;
	commissionEarned: number;
}

interface Adjustment {
	_id: string;
	type: "credit" | "debit";
	amount: number;
	description: string;
	referenceId?: string;
	targetWallet: "netBalance" | "commissionEarned";
	createdAt: string;
	userId?: Agent;
}

export default function AdjustmentsPage() {
	const [search, setSearch] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [filterAgentId, setFilterAgentId] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	// New Adjustment Form State
	const [showForm, setShowForm] = useState(false);
	const [selectedAgent, setSelectedAgent] = useState("");
	const [type, setType] = useState<"credit" | "debit">("credit");
	const [targetWallet, setTargetWallet] = useState<"netBalance" | "commissionEarned">("netBalance");
	const [amount, setAmount] = useState("");
	const [description, setDescription] = useState("");
	const [referenceId, setReferenceId] = useState("");

	// Queries
	const { data: statsData } = useQuery({
		queryKey: ["admin-stats-finance"],
		queryFn: async () => {
			const res = await axios.get("/api/admin/stats/finance");
			return res.data?.data;
		},
		refetchInterval: 30000,
	});

	const { data: agentsData } = useQuery({
		queryKey: ["admin-agents-list"],
		queryFn: async () => {
			const res = await axios.get("/api/admin/agents", { params: { limit: 100 } });
			return res.data?.data as Agent[];
		},
	});

	const { data: historyData, isLoading, isError, error } = useQuery({
		queryKey: ["admin-adjustments", page, search, filterType, filterAgentId, from, to],
		queryFn: async () => {
			const res = await axios.get("/api/admin/adjustments", {
				params: {
					page,
					limit,
					search,
					type: filterType,
					agentId: filterAgentId,
					from,
					to,
				},
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	const mutation = useMutation({
		mutationFn: async (payload: any) => {
			const res = await axios.post("/api/admin/adjustments", payload);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-adjustments"] });
			queryClient.invalidateQueries({ queryKey: ["admin-stats-finance"] });
			setShowForm(false);
			setAmount("");
			setDescription("");
			setReferenceId("");
			alert("Adjustment applied successfully!");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to apply adjustment");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedAgent || !amount || !description) {
			return alert("Please fill all required fields.");
		}
		if (confirm(`Are you sure you want to ${type} ₹${amount} to ${targetWallet}?`)) {
			mutation.mutate({
				userId: selectedAgent,
				type,
				amount,
				targetWallet,
				description,
				referenceId,
			});
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Finance & Adjustments</h1>
				<Button variant="primary" onClick={() => setShowForm(!showForm)}>
					{showForm ? "Close Form" : "New Adjustment"}
				</Button>
			</div>

			{/* KPI Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card className="p-6">
					<div className="text-sm text-muted mb-1">Total Pending Payouts</div>
					<div className="text-2xl font-bold text-foreground">
						₹{statsData?.totalPendingPayouts?.toLocaleString("en-IN") || 0}
					</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm text-muted mb-1">Total Blocked Deposits</div>
					<div className="text-2xl font-bold text-foreground">
						₹{statsData?.totalBlockedDeposit?.toLocaleString("en-IN") || 0}
					</div>
				</Card>
				<Card className="p-6">
					<div className="text-sm text-muted mb-1">Global Withdrawal Hold</div>
					<div className="text-2xl font-bold text-foreground">
						₹{statsData?.globalWithdrawalHold?.toLocaleString("en-IN") || 0}
					</div>
				</Card>
			</div>

			{/* New Adjustment Form */}
			{showForm && (
				<Card className="p-6 bg-card border-accent-gold/20">
					<h2 className="text-lg font-semibold text-foreground mb-4">Create Manual Adjustment</h2>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<label className="block text-sm font-medium text-foreground">Select Agent</label>
								<select
									className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent-gold"
									value={selectedAgent}
									onChange={(e) => setSelectedAgent(e.target.value)}
									required
								>
									<option value="">-- Select an Agent --</option>
									{agentsData?.map((agent) => (
										<option key={agent._id} value={agent._id}>
											{agent.name} ({agent.phone}) - Bal: ₹{agent.netBalance}
										</option>
									))}
								</select>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-foreground">Target Wallet</label>
								<select
									className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent-gold"
									value={targetWallet}
									onChange={(e) => setTargetWallet(e.target.value as any)}
									required
								>
									<option value="netBalance">Net Balance</option>
									<option value="commissionEarned">Commission Earned</option>
								</select>
							</div>

							<div className="space-y-2">
								<label className="block text-sm font-medium text-foreground">Type</label>
								<select
									className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent-gold"
									value={type}
									onChange={(e) => setType(e.target.value as any)}
									required
								>
									<option value="credit">Credit (+)</option>
									<option value="debit">Debit (-)</option>
								</select>
							</div>

							<div className="space-y-2">
								<Input
									label="Amount (₹)"
									type="number"
									min="1"
									value={amount}
									onChange={(e) => setAmount(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Input
									label="Description / Reason"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									required
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Input
									label="Reference ID (Optional)"
									value={referenceId}
									onChange={(e) => setReferenceId(e.target.value)}
								/>
							</div>
						</div>

						<div className="flex justify-end pt-4">
							<Button type="submit" variant="cta" disabled={mutation.isPending}>
								{mutation.isPending ? "Applying..." : "Apply Adjustment"}
							</Button>
						</div>
					</form>
				</Card>
			)}

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Search by agent or Reference ID..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<select
						className="h-10 w-full sm:w-40 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground outline-none focus:border-accent-gold"
						value={filterType}
						onChange={(e) => {
							setFilterType(e.target.value);
							setPage(1);
						}}
					>
						<option value="all">All Types</option>
						<option value="credit">Credit</option>
						<option value="debit">Debit</option>
					</select>
					<select
						className="h-10 w-full sm:w-56 rounded-lg border border-border bg-card px-3 text-sm text-card-foreground outline-none focus:border-accent-gold"
						value={filterAgentId}
						onChange={(e) => {
							setFilterAgentId(e.target.value);
							setPage(1);
						}}
					>
						<option value="">All Agents</option>
						{agentsData?.map((agent) => (
							<option key={agent._id} value={agent._id}>
								{agent.name} ({agent.phone})
							</option>
						))}
					</select>
					<Input
						type="date"
						value={from}
						onChange={(e) => {
							setFrom(e.target.value);
							setPage(1);
						}}
					/>
					<Input
						type="date"
						value={to}
						onChange={(e) => {
							setTo(e.target.value);
							setPage(1);
						}}
					/>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading adjustments. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">Type</th>
									<th className="pb-3 font-medium">Wallet</th>
									<th className="pb-3 font-medium">Amount</th>
									<th className="pb-3 font-medium">Description</th>
									<th className="pb-3 font-medium">Date</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{historyData?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No adjustments found.
										</td>
									</tr>
								) : (
									historyData?.data?.map((adj: Adjustment) => (
										<tr key={adj._id} className="hover:bg-card/50">
											<td className="py-3">
												{adj.userId ? (
													<>
														<div className="font-medium text-foreground">
															<Link href={`/admin/agents/${adj.userId._id}`} className="hover:underline">
																{adj.userId.name}
															</Link>
														</div>
														<div className="text-xs text-muted">{adj.userId.phone}</div>
													</>
												) : (
													<span className="text-muted text-xs">N/A</span>
												)}
											</td>
											<td className="py-3">
												<Badge variant={adj.type === "credit" ? "success" : "danger"}>
													{adj.type.toUpperCase()}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{adj.targetWallet === "netBalance" ? "Net Balance" : "Comm Earned"}
											</td>
											<td className="py-3 text-foreground font-medium">
												₹{adj.amount.toLocaleString("en-IN")}
											</td>
											<td className="py-3">
												<div className="text-foreground max-w-[200px] truncate" title={adj.description}>{adj.description}</div>
												{adj.referenceId && (
													<div className="text-xs text-muted mt-1">Ref: {adj.referenceId}</div>
												)}
											</td>
											<td className="py-3 text-muted">
												{new Date(adj.createdAt).toLocaleString()}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}

				{historyData?.pagination && historyData.pagination.pages > 1 && (
					<div className="mt-6 flex justify-between items-center text-sm text-muted">
						<div>
							Showing page {historyData.pagination.page} of {historyData.pagination.pages}
						</div>
						<div className="flex space-x-2">
							<Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
							<Button variant="secondary" size="sm" disabled={page === historyData.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
