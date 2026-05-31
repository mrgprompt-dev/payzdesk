"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface JobData {
	_id: string;
	amount: number;
	status: string;
	expiresAt: string;
	createdAt: string;
	grabbedBy?: {
		name: string;
		phone: string;
	};
	bankId?: {
		bankName: string;
		accountNumber: string;
	};
}

interface JobsResponse {
	success: boolean;
	data: JobData[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function LivePoolPage() {
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	const { data, isLoading, isError, error, refetch } = useQuery<JobsResponse>({
		queryKey: ["admin-live-pool", page, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/live-pool", {
				params: { page, limit, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
		refetchInterval: 10000, // Refresh every 10 seconds to catch expirations
	});

	const mutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await axios.patch(`/api/admin/live-pool/${id}`, { action: "cancel" });
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-live-pool"] });
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to cancel job");
		},
	});

	const handleCancel = (id: string) => {
		if (confirm("Are you sure you want to cancel this live pool job?")) {
			mutation.mutate(id);
		}
	};

	// Helper to calculate time remaining
	const getTimeRemaining = (expiresAt: string) => {
		const diff = new Date(expiresAt).getTime() - new Date().getTime();
		if (diff <= 0) return "Expired";
		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		return `${minutes}m ${seconds}s`;
	};

	// Force re-render every second to update countdowns
	const [, setTick] = useState(0);
	useEffect(() => {
		const timer = setInterval(() => setTick((t) => t + 1), 1000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Live Pool Jobs</h1>
				<Link href="/admin/live-pool/create">
					<Button variant="primary">
						Create New Job
					</Button>
				</Link>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
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
							<option value="available">Available</option>
							<option value="grabbed">Grabbed</option>
							<option value="completed">Completed</option>
							<option value="expired">Expired</option>
						</select>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading jobs. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Job ID / Time</th>
									<th className="pb-3 font-medium">Amount</th>
									<th className="pb-3 font-medium">Bank Details</th>
									<th className="pb-3 font-medium">Status / Countdown</th>
									<th className="pb-3 font-medium">Grabbed By</th>
									<th className="pb-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No live pool jobs found.
										</td>
									</tr>
								) : (
									data?.data?.map((job: JobData) => {
										// local expiration check for display
										const isExpired = new Date(job.expiresAt).getTime() < new Date().getTime();
										const displayStatus = (job.status === "available" && isExpired) ? "expired" : job.status;

										return (
											<tr key={job._id} className="hover:bg-card/50">
												<td className="py-3">
													<div className="text-xs font-mono text-muted">{job._id}</div>
													<div className="text-xs text-foreground mt-1">
														{new Date(job.createdAt).toLocaleTimeString()}
													</div>
												</td>
												<td className="py-3 text-foreground font-medium text-lg">
													₹{job.amount.toLocaleString("en-IN")}
												</td>
												<td className="py-3">
													{job.bankId ? (
														<>
															<div className="text-foreground">{job.bankId.bankName}</div>
															<div className="text-xs text-muted">A/C: {job.bankId.accountNumber}</div>
														</>
													) : (
														<span className="text-muted text-xs">N/A</span>
													)}
												</td>
												<td className="py-3">
													<Badge
														variant={
															displayStatus === "available"
																? "gold"
																: displayStatus === "completed"
																? "success"
																: displayStatus === "grabbed"
																? "default"
																: "danger"
														}
													>
														{displayStatus}
													</Badge>
													{displayStatus === "available" && (
														<div className="text-xs text-accent-gold mt-1 font-mono">
															{getTimeRemaining(job.expiresAt)}
														</div>
													)}
												</td>
												<td className="py-3">
													{job.grabbedBy ? (
														<>
															<div className="font-medium text-foreground">{job.grabbedBy.name}</div>
															<div className="text-xs text-muted">{job.grabbedBy.phone}</div>
														</>
													) : (
														<span className="text-muted text-xs">-</span>
													)}
												</td>
												<td className="py-3 text-right">
													{job.status === "available" && (
														<Button
															variant="danger"
															size="sm"
															onClick={() => handleCancel(job._id)}
															disabled={mutation.isPending}
														>
															Cancel
														</Button>
													)}
												</td>
											</tr>
										);
									})
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
