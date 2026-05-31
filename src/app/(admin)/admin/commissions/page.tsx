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

interface PerformanceCommission {
	_id: string;
	totalEarned: number;
	status: string;
	lastReleasedDate: string | null;
	createdAt: string;
	userId?: {
		_id: string;
		name: string;
		phone: string;
		commissionEarned: number;
	};
}

interface ReferralCycle {
	_id: string;
	amount: number;
	status: string;
	startDate: string;
	endDate: string;
	createdAt: string;
	userId?: {
		_id: string;
		name: string;
		phone: string;
		commissionEarned: number;
	};
}

export default function CommissionsPage() {
	const [activeTab, setActiveTab] = useState<"performance" | "referral">("performance");
	
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	// === Performance Commission Query ===
	const { data: perfData, isLoading: perfLoading, isError: perfError } = useQuery({
		queryKey: ["admin-commissions-perf", page, search, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/commissions", {
				params: { page, limit, search, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
		enabled: activeTab === "performance",
	});

	const perfMutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await axios.patch(`/api/admin/commissions/${id}`, { action: "release" });
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-commissions-perf"] });
			alert("Performance commission released successfully!");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to release commission");
		},
	});

	// === Referral Cycle Query ===
	const { data: refData, isLoading: refLoading, isError: refError } = useQuery({
		queryKey: ["admin-commissions-ref", page, search, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/commissions/referral", {
				params: { page, limit, search, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
		enabled: activeTab === "referral",
	});

	const refMutation = useMutation({
		mutationFn: async (payload: { id: string; action: "close" | "release" }) => {
			const res = await axios.patch(`/api/admin/commissions/referral/${payload.id}`, {
				action: payload.action,
			});
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-commissions-ref"] });
			alert("Referral payout released successfully!");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to release payout");
		},
	});

	// Handlers
	const handleReleasePerf = (id: string) => {
		if (confirm("Are you sure you want to release this performance commission? The amount will be added to the agent's commission balance.")) {
			perfMutation.mutate(id);
		}
	};

	const handleReleaseRef = (id: string) => {
		if (confirm("Are you sure you want to release this referral payout? The amount will be added to the agent's commission balance.")) {
			refMutation.mutate({ id, action: "release" });
		}
	};

	const handleCloseRef = (id: string) => {
		if (confirm("Are you sure you want to close this active referral cycle?")) {
			refMutation.mutate({ id, action: "close" });
		}
	};

	const handleTabChange = (tab: "performance" | "referral") => {
		setActiveTab(tab);
		setPage(1);
		setStatus("all");
		setSearch("");
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Commissions & Payouts</h1>
				<div className="flex bg-card border border-border rounded-lg overflow-hidden">
					<button
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === "performance"
								? "bg-accent-gold text-accent-gold-foreground"
								: "text-muted hover:text-foreground"
						}`}
						onClick={() => handleTabChange("performance")}
					>
						Performance
					</button>
					<button
						className={`px-4 py-2 text-sm font-medium transition-colors ${
							activeTab === "referral"
								? "bg-accent-gold text-accent-gold-foreground"
								: "text-muted hover:text-foreground"
						}`}
						onClick={() => handleTabChange("referral")}
					>
						Referrals
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
							{activeTab === "performance" ? (
								<>
									<option value="pending">Pending</option>
									<option value="released">Released</option>
								</>
							) : (
								<>
									<option value="pending_payout">Pending</option>
									<option value="active">Active</option>
									<option value="closed">Closed</option>
									<option value="credited">Credited</option>
								</>
							)}
						</select>
					</div>
				</div>

				{/* PERFORMANCE TAB CONTENT */}
				{activeTab === "performance" && (
					<>
						{perfLoading ? (
							<div className="flex justify-center items-center py-12">
								<Spinner size="lg" />
							</div>
						) : perfError ? (
							<div className="text-destructive py-4 text-center">Error loading data.</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm whitespace-nowrap">
									<thead>
										<tr className="border-b border-border text-muted">
											<th className="pb-3 font-medium">Agent</th>
											<th className="pb-3 font-medium">Total Earned</th>
											<th className="pb-3 font-medium text-center">Status</th>
											<th className="pb-3 font-medium">Last Released</th>
											<th className="pb-3 font-medium text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{perfData?.data?.length === 0 ? (
											<tr>
												<td colSpan={5} className="py-6 text-center text-muted">
													No performance commissions found.
												</td>
											</tr>
										) : (
											perfData?.data?.map((item: PerformanceCommission) => (
												<tr key={item._id} className="hover:bg-card/50">
													<td className="py-3">
														{item.userId ? (
															<>
																<div className="font-medium text-foreground">
																	<Link href={`/admin/agents/${item.userId._id}`} className="hover:underline">
																		{item.userId.name}
																	</Link>
																</div>
																<div className="text-xs text-muted">{item.userId.phone}</div>
																<div className="text-xs text-accent-gold mt-1">Comm Bal: ₹{item.userId.commissionEarned.toLocaleString("en-IN")}</div>
															</>
														) : (
															<span className="text-muted text-xs">N/A</span>
														)}
													</td>
													<td className="py-3 text-foreground font-medium text-lg">
														₹{item.totalEarned.toLocaleString("en-IN")}
													</td>
													<td className="py-3 text-center">
														<Badge variant={item.status === "released" ? "success" : "gold"}>
															{item.status}
														</Badge>
													</td>
													<td className="py-3 text-muted">
														{item.lastReleasedDate ? new Date(item.lastReleasedDate).toLocaleDateString() : "Never"}
													</td>
													<td className="py-3 text-right">
														{item.status === "pending" && (
															<Button
																variant="cta"
																size="sm"
																onClick={() => handleReleasePerf(item._id)}
																disabled={perfMutation.isPending}
															>
																Release
															</Button>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}
						{perfData?.pagination && perfData.pagination.pages > 1 && (
							<div className="mt-6 flex justify-between items-center text-sm text-muted">
								<div>
									Showing page {perfData.pagination.page} of {perfData.pagination.pages}
								</div>
								<div className="flex space-x-2">
									<Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
									<Button variant="secondary" size="sm" disabled={page === perfData.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
								</div>
							</div>
						)}
					</>
				)}

				{/* REFERRAL TAB CONTENT */}
				{activeTab === "referral" && (
					<>
						{refLoading ? (
							<div className="flex justify-center items-center py-12">
								<Spinner size="lg" />
							</div>
						) : refError ? (
							<div className="text-destructive py-4 text-center">Error loading data.</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-sm whitespace-nowrap">
									<thead>
										<tr className="border-b border-border text-muted">
											<th className="pb-3 font-medium">Agent</th>
											<th className="pb-3 font-medium">Cycle Amount</th>
											<th className="pb-3 font-medium">Cycle Dates</th>
											<th className="pb-3 font-medium text-center">Status</th>
											<th className="pb-3 font-medium text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{refData?.data?.length === 0 ? (
											<tr>
												<td colSpan={5} className="py-6 text-center text-muted">
													No referral cycles found.
												</td>
											</tr>
										) : (
											refData?.data?.map((item: ReferralCycle) => (
												<tr key={item._id} className="hover:bg-card/50">
													<td className="py-3">
														{item.userId ? (
															<>
																<div className="font-medium text-foreground">
																	<Link href={`/admin/agents/${item.userId._id}`} className="hover:underline">
																		{item.userId.name}
																	</Link>
																</div>
																<div className="text-xs text-muted">{item.userId.phone}</div>
																<div className="text-xs text-accent-gold mt-1">Comm Bal: ₹{item.userId.commissionEarned.toLocaleString("en-IN")}</div>
															</>
														) : (
															<span className="text-muted text-xs">N/A</span>
														)}
													</td>
													<td className="py-3 text-foreground font-medium text-lg">
														₹{item.amount.toLocaleString("en-IN")}
													</td>
													<td className="py-3 text-muted text-xs">
														{new Date(item.startDate).toLocaleDateString()} - <br/>
														{new Date(item.endDate).toLocaleDateString()}
													</td>
													<td className="py-3 text-center">
														<Badge variant={item.status === "credited" ? "success" : "gold"}>
															{item.status}
														</Badge>
													</td>
													<td className="py-3 text-right">
														{item.status === "active" && (
															<Button
																variant="secondary"
																size="sm"
																onClick={() => handleCloseRef(item._id)}
																disabled={refMutation.isPending}
															>
																Close Cycle
															</Button>
														)}
														{(item.status === "pending_payout" || item.status === "closed") && (
															<Button
																variant="cta"
																size="sm"
																onClick={() => handleReleaseRef(item._id)}
																disabled={refMutation.isPending}
															>
																Release Payout
															</Button>
														)}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						)}
						{refData?.pagination && refData.pagination.pages > 1 && (
							<div className="mt-6 flex justify-between items-center text-sm text-muted">
								<div>
									Showing page {refData.pagination.page} of {refData.pagination.pages}
								</div>
								<div className="flex space-x-2">
									<Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
									<Button variant="secondary" size="sm" disabled={page === refData.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
								</div>
							</div>
						)}
					</>
				)}
			</Card>
		</div>
	);
}
