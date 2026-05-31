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

interface TransactionData {
	_id: string;
	type: string;
	amount: number;
	status: string;
	notes?: string;
	createdAt: string;
	userId?: {
		_id: string;
		name: string;
		phone: string;
		netBalance: number;
	};
	bankId?: {
		bankName: string;
		accountNumber: string;
	};
}

interface TransactionsResponse {
	success: boolean;
	data: TransactionData[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function SecurityDepositsPage() {
	const [view, setView] = useState<"pending" | "all">("pending");
	
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	const [rejectId, setRejectId] = useState<string | null>(null);
	const [rejectNote, setRejectNote] = useState("");

	const activeStatus = view === "pending" ? "pending" : status;

	const { data, isLoading, isError, error } = useQuery<TransactionsResponse>({
		queryKey: ["admin-security-deposits", page, search, activeStatus],
		queryFn: async () => {
			const res = await axios.get("/api/admin/security-deposits", {
				params: { page, limit, search, status: activeStatus },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	const mutation = useMutation({
		mutationFn: async ({ id, action, note }: { id: string; action: string; note?: string }) => {
			const res = await axios.patch(`/api/admin/security-deposits/${id}`, { action, note });
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-security-deposits"] });
			setRejectId(null);
			setRejectNote("");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to process security deposit");
		},
	});

	const handleApprove = (id: string) => {
		if (confirm("Are you sure you want to approve this security deposit?")) {
			mutation.mutate({ id, action: "approve" });
		}
	};

	const handleRejectSubmit = (id: string) => {
		if (!rejectNote.trim()) {
			alert("Please enter a reason for rejection.");
			return;
		}
		if (confirm("Are you sure you want to reject this security deposit?")) {
			mutation.mutate({ id, action: "reject", note: rejectNote.trim() });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Security Deposits</h1>
				<div className="flex bg-card border border-border rounded-lg overflow-hidden">
					<button
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							view === "pending"
								? "bg-accent-gold text-accent-gold-foreground"
								: "text-muted hover:text-foreground"
						}`}
						onClick={() => {
							setView("pending");
							setPage(1);
							setRejectId(null);
						}}
					>
						Pending Queue
					</button>
					<button
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							view === "all"
								? "bg-accent-gold text-accent-gold-foreground"
								: "text-muted hover:text-foreground"
						}`}
						onClick={() => {
							setView("all");
							setPage(1);
							setRejectId(null);
						}}
					>
						All History
					</button>
				</div>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Search by agent phone or name..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					{view === "all" && (
						<div className="w-full sm:w-48">
							<select
								className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-card-foreground outline-none focus:border-accent-gold"
								value={status}
								onChange={(e) => {
									setStatus(e.target.value);
									setPage(1);
								}}
							>
								<option value="all">All Status</option>
								<option value="pending">Pending</option>
								<option value="completed">Completed</option>
								<option value="failed">Failed</option>
								<option value="cancelled">Cancelled</option>
							</select>
						</div>
					)}
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading security deposits. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">Amount</th>
									<th className="pb-3 font-medium">Bank / Method</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Date</th>
									<th className="pb-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No security deposits found.
										</td>
									</tr>
								) : (
									data?.data?.map((txn: TransactionData) => (
										<tr key={txn._id} className="hover:bg-card/50">
											<td className="py-3">
												{txn.userId ? (
													<>
														<div className="font-medium text-foreground">
															<Link href={`/admin/agents/${txn.userId._id}`} className="hover:underline">
																{txn.userId.name}
															</Link>
														</div>
														<div className="text-xs text-muted">{txn.userId.phone}</div>
														<div className="text-xs text-accent-gold mt-1">Bal: ₹{txn.userId.netBalance.toLocaleString("en-IN")}</div>
													</>
												) : (
													<span className="text-muted text-xs">N/A</span>
												)}
											</td>
											<td className="py-3">
												<div className="text-foreground font-medium text-lg">
													₹{txn.amount.toLocaleString("en-IN")}
												</div>
												{txn.notes && (
													<div className="text-xs text-destructive max-w-[150px] truncate" title={txn.notes}>
														{txn.notes}
													</div>
												)}
											</td>
											<td className="py-3">
												{txn.bankId ? (
													<>
														<div className="text-foreground">{txn.bankId.bankName}</div>
														<div className="text-xs text-muted">{txn.bankId.accountNumber}</div>
													</>
												) : (
													<span className="text-muted text-xs">Manual / Unknown</span>
												)}
											</td>
											<td className="py-3 text-center">
												<Badge
													variant={
														txn.status === "completed"
															? "success"
															: txn.status === "failed" || txn.status === "cancelled"
															? "danger"
															: txn.status === "pending"
															? "gold"
															: "default"
													}
												>
													{txn.status}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{new Date(txn.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 text-right">
												{txn.status === "pending" && (
													<div className="flex flex-col items-end gap-2">
														{rejectId === txn._id ? (
															<div className="flex flex-col gap-2 min-w-[200px]">
																<Input
																	placeholder="Reason for rejection..."
																	value={rejectNote}
																	onChange={(e) => setRejectNote(e.target.value)}
																/>
																<div className="flex gap-2">
																	<Button
																		variant="danger"
																		size="sm"
																		className="flex-1"
																		onClick={() => handleRejectSubmit(txn._id)}
																		disabled={mutation.isPending}
																	>
																		Confirm
																	</Button>
																	<Button
																		variant="ghost"
																		size="sm"
																		className="flex-1"
																		onClick={() => {
																			setRejectId(null);
																			setRejectNote("");
																		}}
																		disabled={mutation.isPending}
																	>
																		Cancel
																	</Button>
																</div>
															</div>
														) : (
															<div className="flex gap-2 justify-end">
																<Button
																	variant="cta"
																	size="sm"
																	onClick={() => handleApprove(txn._id)}
																	disabled={mutation.isPending}
																>
																	Approve
																</Button>
																<Button
																	variant="danger"
																	size="sm"
																	onClick={() => {
																		setRejectId(txn._id);
																		setRejectNote("");
																	}}
																	disabled={mutation.isPending}
																>
																	Reject
																</Button>
															</div>
														)}
													</div>
												)}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				)}

				{data?.pagination && data.pagination.pages > 1 && (
					<div className="mt-6 flex justify-between items-center text-sm text-muted">
						<div>
							Showing page {data.pagination.page} of {data.pagination.pages}
						</div>
						<div className="flex space-x-2">
							<Button
								variant="secondary"
								size="sm"
								disabled={page === 1}
								onClick={() => setPage((p) => p - 1)}
							>
								Prev
							</Button>
							<Button
								variant="secondary"
								size="sm"
								disabled={page === data.pagination.pages}
								onClick={() => setPage((p) => p + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
