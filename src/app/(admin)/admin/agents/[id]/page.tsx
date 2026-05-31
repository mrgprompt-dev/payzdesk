"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useParams } from "next/navigation";

interface AgentDetail {
	_id: string;
	phone: string;
	name: string;
	isActive: boolean;
	createdAt: string;
	netBalance: number;
	blockedDeposit: number;
	withdrawalHoldAmount: number;
	commissionEarned: number;
	maxWithdrawalPerTxn: number;
	banks: any[];
	transactions: any[];
}

export default function AgentDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const queryClient = useQueryClient();

	const [limitInput, setLimitInput] = useState("");
	const [isEditingLimit, setIsEditingLimit] = useState(false);

	const { data, isLoading, isError } = useQuery<AgentDetail>({
		queryKey: ["admin-agent-detail", id],
		queryFn: async () => {
			const res = await axios.get(`/api/admin/agents/${id}`);
			return res.data?.data;
		},
	});

	const mutation = useMutation({
		mutationFn: async (updates: any) => {
			const res = await axios.patch(`/api/admin/agents/${id}`, updates);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-agent-detail", id] });
			setIsEditingLimit(false);
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to update agent");
		},
	});

	const handleToggleStatus = () => {
		if (!data) return;
		const confirmMsg = data.isActive
			? "Are you sure you want to deactivate this agent?"
			: "Are you sure you want to activate this agent?";
		if (confirm(confirmMsg)) {
			mutation.mutate({ isActive: !data.isActive });
		}
	};

	const handleSaveLimit = () => {
		const newLimit = Number(limitInput);
		if (isNaN(newLimit) || newLimit < 0) {
			alert("Invalid amount");
			return;
		}
		mutation.mutate({ maxWithdrawalPerTxn: newLimit });
	};

	if (isLoading) {
		return (
			<div className="flex justify-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (isError || !data) {
		return (
			<div className="text-center py-20 text-destructive">
				Error loading agent details.
			</div>
		);
	}

	const agent = data;

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-4">
				<Link href="/admin/agents" className="text-muted hover:text-foreground">
					&larr; Back to Agents
				</Link>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<Card className="col-span-1 p-6 space-y-6">
					<div>
						<h2 className="text-xl font-semibold text-foreground">{agent.name}</h2>
						<p className="text-sm text-muted">{agent.phone}</p>
						<div className="mt-2">
							<Badge variant={agent.isActive ? "success" : "danger"}>
								{agent.isActive ? "Active" : "Inactive"}
							</Badge>
						</div>
					</div>

					<div className="pt-4 border-t border-border space-y-3 text-sm">
						<div className="flex justify-between">
							<span className="text-muted">Joined</span>
							<span className="text-foreground font-medium">
								{new Date(agent.createdAt).toLocaleDateString()}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Net Balance</span>
							<span className="text-foreground font-medium text-accent-green">
								₹{agent.netBalance.toLocaleString("en-IN")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Blocked Deposit</span>
							<span className="text-foreground font-medium text-accent-gold">
								₹{agent.blockedDeposit.toLocaleString("en-IN")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Withdrawal Hold</span>
							<span className="text-foreground font-medium text-destructive">
								₹{agent.withdrawalHoldAmount.toLocaleString("en-IN")}
							</span>
						</div>
						<div className="flex justify-between">
							<span className="text-muted">Commission Earned</span>
							<span className="text-foreground font-medium">
								₹{agent.commissionEarned.toLocaleString("en-IN")}
							</span>
						</div>
					</div>

					<div className="pt-4 border-t border-border space-y-4">
						<div>
							<label className="text-sm font-medium text-muted mb-2 block">
								Max Withdrawal / Txn
							</label>
							{isEditingLimit ? (
								<div className="flex gap-2">
									<Input
										type="number"
										value={limitInput}
										onChange={(e) => setLimitInput(e.target.value)}
										className="h-8"
									/>
									<Button size="sm" onClick={handleSaveLimit} disabled={mutation.isPending}>
										Save
									</Button>
									<Button
										size="sm"
										variant="ghost"
										onClick={() => {
											setLimitInput(agent.maxWithdrawalPerTxn.toString());
											setIsEditingLimit(false);
										}}
									>
										Cancel
									</Button>
								</div>
							) : (
								<div className="flex justify-between items-center">
									<span className="text-foreground font-medium">
										₹{agent.maxWithdrawalPerTxn.toLocaleString("en-IN")}
									</span>
									<Button
										size="sm"
										variant="secondary"
										onClick={() => {
											setLimitInput(agent.maxWithdrawalPerTxn.toString());
											setIsEditingLimit(true);
										}}
									>
										Edit
									</Button>
								</div>
							)}
						</div>
						
						<Button
							variant={agent.isActive ? "danger" : "cta"}
							className="w-full"
							onClick={handleToggleStatus}
							disabled={mutation.isPending}
						>
							{agent.isActive ? "Deactivate Agent" : "Activate Agent"}
						</Button>
					</div>
				</Card>

				<div className="col-span-1 lg:col-span-2 space-y-6">
					<Card className="p-6">
						<h3 className="text-lg font-semibold text-foreground mb-4">Bank Accounts</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm whitespace-nowrap">
								<thead>
									<tr className="border-b border-border text-muted">
										<th className="pb-3 font-medium">Bank Name</th>
										<th className="pb-3 font-medium">Account No</th>
										<th className="pb-3 font-medium">IFSC</th>
										<th className="pb-3 font-medium text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{agent.banks?.length === 0 ? (
										<tr>
											<td colSpan={4} className="py-4 text-center text-muted">
												No bank accounts found.
											</td>
										</tr>
									) : (
										agent.banks?.map((bank: any) => (
											<tr key={bank._id}>
												<td className="py-3 text-foreground">{bank.bankName}</td>
												<td className="py-3 text-muted">{bank.accountNumber}</td>
												<td className="py-3 text-muted">{bank.ifscCode}</td>
												<td className="py-3 text-center">
													<Badge
														variant={
															bank.status === "active"
																? "success"
																: bank.status === "rejected"
																? "danger"
																: "default"
														}
													>
														{bank.status}
													</Badge>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</Card>

					<Card className="p-6">
						<h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
						<div className="overflow-x-auto">
							<table className="w-full text-left text-sm whitespace-nowrap">
								<thead>
									<tr className="border-b border-border text-muted">
										<th className="pb-3 font-medium">Type</th>
										<th className="pb-3 font-medium">Amount</th>
										<th className="pb-3 font-medium">Date</th>
										<th className="pb-3 font-medium text-center">Status</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border">
									{agent.transactions?.length === 0 ? (
										<tr>
											<td colSpan={4} className="py-4 text-center text-muted">
												No recent transactions.
											</td>
										</tr>
									) : (
										agent.transactions?.map((txn: any) => (
											<tr key={txn._id}>
												<td className="py-3 text-foreground capitalize">{txn.type.replace('_', ' ')}</td>
												<td className="py-3 text-foreground font-medium">
													₹{txn.amount.toLocaleString("en-IN")}
												</td>
												<td className="py-3 text-muted">
													{new Date(txn.createdAt).toLocaleDateString()}
												</td>
												<td className="py-3 text-center">
													<Badge
														variant={
															txn.status === "completed"
																? "success"
																: txn.status === "rejected"
																? "danger"
																: txn.status === "pending"
																? "gold"
																: "default"
														}
													>
														{txn.status}
													</Badge>
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}
