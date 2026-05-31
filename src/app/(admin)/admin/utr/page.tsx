"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface UTRData {
	_id: string;
	utrNumber: string;
	amount: number;
	status: string;
	notes?: string;
	createdAt: string;
	userId?: {
		name: string;
		phone: string;
	};
	bankId?: {
		bankName: string;
		accountNumber: string;
		ifscCode: string;
	};
}

interface UTRsResponse {
	success: boolean;
	data: UTRData[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function UTRPage() {
	const [view, setView] = useState<"pending" | "all">("pending");
	
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	const [rejectId, setRejectId] = useState<string | null>(null);
	const [rejectNote, setRejectNote] = useState("");

	const activeStatus = view === "pending" ? "pending" : status;

	const { data, isLoading, isError, error } = useQuery<UTRsResponse>({
		queryKey: ["admin-utrs", page, search, activeStatus],
		queryFn: async () => {
			const res = await axios.get("/api/admin/utr", {
				params: { page, limit, search, status: activeStatus },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	const mutation = useMutation({
		mutationFn: async ({ id, action, note }: { id: string; action: string; note?: string }) => {
			const res = await axios.patch(`/api/admin/utr/${id}`, { action, note });
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-utrs"] });
			setRejectId(null);
			setRejectNote("");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to update UTR");
		},
	});

	const handleVerify = (id: string) => {
		if (confirm("Are you sure you want to verify this UTR?")) {
			mutation.mutate({ id, action: "verify" });
		}
	};

	const handleRejectSubmit = (id: string) => {
		if (!rejectNote.trim()) {
			alert("Please enter a reason for rejection.");
			return;
		}
		if (confirm("Are you sure you want to reject this UTR?")) {
			mutation.mutate({ id, action: "reject", note: rejectNote.trim() });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">UTR Verification</h1>
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
							placeholder="Search by agent phone/name or UTR number..."
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
								<option value="verified">Verified</option>
								<option value="rejected">Rejected</option>
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
						Error loading UTRs. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">UTR Info</th>
									<th className="pb-3 font-medium">Amount</th>
									<th className="pb-3 font-medium">Bank Details</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Date</th>
									<th className="pb-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={7} className="py-6 text-center text-muted">
											No UTRs found.
										</td>
									</tr>
								) : (
									data?.data?.map((utr: UTRData) => (
										<tr key={utr._id} className="hover:bg-card/50">
											<td className="py-3">
												<div className="font-medium text-foreground">{utr.userId?.name || "N/A"}</div>
												<div className="text-xs text-muted">{utr.userId?.phone}</div>
											</td>
											<td className="py-3">
												<div className="font-medium text-foreground font-mono">{utr.utrNumber}</div>
												{utr.notes && (
													<div className="text-xs text-destructive max-w-[150px] truncate" title={utr.notes}>
														{utr.notes}
													</div>
												)}
											</td>
											<td className="py-3 text-foreground font-medium">
												₹{utr.amount.toLocaleString("en-IN")}
											</td>
											<td className="py-3">
												{utr.bankId ? (
													<>
														<div className="text-foreground">{utr.bankId.bankName}</div>
														<div className="text-xs text-muted">IFSC: {utr.bankId.ifscCode}</div>
													</>
												) : (
													<span className="text-muted text-xs">N/A</span>
												)}
											</td>
											<td className="py-3 text-center">
												<Badge
													variant={
														utr.status === "verified"
															? "success"
															: utr.status === "rejected"
															? "danger"
															: utr.status === "pending"
															? "gold"
															: "default"
													}
												>
													{utr.status}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{new Date(utr.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 text-right">
												{utr.status === "pending" && (
													<div className="flex flex-col items-end gap-2">
														{rejectId === utr._id ? (
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
																		onClick={() => handleRejectSubmit(utr._id)}
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
																	onClick={() => handleVerify(utr._id)}
																	disabled={mutation.isPending}
																>
																	Verify
																</Button>
																<Button
																	variant="danger"
																	size="sm"
																	onClick={() => {
																		setRejectId(utr._id);
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
