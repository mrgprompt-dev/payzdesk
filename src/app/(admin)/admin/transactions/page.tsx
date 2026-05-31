"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface Transaction {
	_id: string;
	type: string;
	amount: number;
	status: string;
	createdAt: string;
	userId?: {
		name: string;
		phone: string;
	};
	bankId?: {
		bankName: string;
		accountNumber: string;
	};
}

interface TransactionsResponse {
	success: boolean;
	data: Transaction[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function TransactionsPage() {
	const [view, setView] = useState<"pending" | "all">("pending");
	
	const [search, setSearch] = useState("");
	const [type, setType] = useState("all");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;

	// In "pending" view, we force the status to "pending"
	const activeStatus = view === "pending" ? "pending" : status;

	const { data, isLoading, isError, error } = useQuery<TransactionsResponse>({
		queryKey: ["admin-transactions", page, search, type, activeStatus],
		queryFn: async () => {
			const res = await axios.get("/api/admin/transactions", {
				params: { page, limit, search, type, status: activeStatus },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Transactions</h1>
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
							placeholder="Search agent phone or name..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<div className="w-full sm:w-48">
						<select
							className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-card-foreground outline-none focus:border-accent-gold"
							value={type}
							onChange={(e) => {
								setType(e.target.value);
								setPage(1);
							}}
						>
							<option value="all">All Types</option>
							<option value="deposit">Deposit</option>
							<option value="withdrawal">Withdrawal</option>
							<option value="security_deposit">Security Deposit</option>
							<option value="security_withdrawal">Security Withdrawal</option>
						</select>
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
						Error loading transactions. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">Type</th>
									<th className="pb-3 font-medium">Amount</th>
									<th className="pb-3 font-medium">Bank Details</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Date</th>
									<th className="pb-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={7} className="py-6 text-center text-muted">
											No transactions found.
										</td>
									</tr>
								) : (
									data?.data?.map((txn: Transaction) => (
										<tr key={txn._id} className="hover:bg-card/50">
											<td className="py-3">
												<div className="font-medium text-foreground">{txn.userId?.name || "N/A"}</div>
												<div className="text-xs text-muted">{txn.userId?.phone}</div>
											</td>
											<td className="py-3 text-foreground capitalize">
												{txn.type.replace('_', ' ')}
											</td>
											<td className="py-3 text-foreground font-medium">
												₹{txn.amount.toLocaleString("en-IN")}
											</td>
											<td className="py-3">
												{txn.bankId ? (
													<>
														<div className="text-foreground">{txn.bankId.bankName}</div>
														<div className="text-xs text-muted">{txn.bankId.accountNumber}</div>
													</>
												) : (
													<span className="text-muted text-xs">N/A</span>
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
												<Link href={`/admin/transactions/${txn._id}`}>
													<Button variant={txn.status === "pending" ? "primary" : "secondary"} size="sm">
														{txn.status === "pending" ? "Review" : "View"}
													</Button>
												</Link>
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
