"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface BankAccount {
	_id: string;
	accountNumber: string;
	ifscCode: string;
	bankName: string;
	status: string;
	createdAt: string;
	userId?: {
		name: string;
		phone: string;
	};
}

interface BanksResponse {
	success: boolean;
	data: BankAccount[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function BanksPage() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;
	const queryClient = useQueryClient();

	const { data, isLoading, isError, error } = useQuery<BanksResponse>({
		queryKey: ["admin-banks", page, search, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/banks", {
				params: { page, limit, search, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	const mutation = useMutation({
		mutationFn: async ({ id, action }: { id: string; action: string }) => {
			const res = await axios.patch(`/api/admin/banks/${id}`, { action });
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-banks"] });
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to update bank account");
		},
	});

	const handleAction = (id: string, action: string) => {
		const actionName = action === "approve" ? "Approve" 
			: action === "reject" ? "Reject" 
			: action === "activate" ? "Activate" 
			: "Deactivate";
		
		if (confirm(`Are you sure you want to ${actionName} this bank account?`)) {
			mutation.mutate({ id, action });
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Bank Accounts</h1>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Search by agent phone or account number..."
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
							<option value="pending">Pending</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
							<option value="rejected">Rejected</option>
						</select>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading bank accounts. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">Bank Name</th>
									<th className="pb-3 font-medium">Account Details</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Date</th>
									<th className="pb-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No bank accounts found.
										</td>
									</tr>
								) : (
									data?.data?.map((bank: BankAccount) => (
										<tr key={bank._id} className="hover:bg-card/50">
											<td className="py-3">
												<div className="font-medium text-foreground">{bank.userId?.name || "N/A"}</div>
												<div className="text-xs text-muted">{bank.userId?.phone}</div>
											</td>
											<td className="py-3 text-foreground font-medium">
												{bank.bankName}
											</td>
											<td className="py-3">
												<div className="text-foreground">{bank.accountNumber}</div>
												<div className="text-xs text-muted">IFSC: {bank.ifscCode}</div>
											</td>
											<td className="py-3 text-center">
												<Badge
													variant={
														bank.status === "active"
															? "success"
															: bank.status === "rejected"
															? "danger"
															: bank.status === "pending"
															? "gold"
															: "default"
													}
												>
													{bank.status}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{new Date(bank.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 text-right">
												<div className="flex justify-end gap-2">
													{bank.status === "pending" && (
														<>
															<Button
																variant="cta"
																size="sm"
																onClick={() => handleAction(bank._id, "approve")}
																disabled={mutation.isPending}
															>
																Approve
															</Button>
															<Button
																variant="danger"
																size="sm"
																onClick={() => handleAction(bank._id, "reject")}
																disabled={mutation.isPending}
															>
																Reject
															</Button>
														</>
													)}
													{bank.status === "active" && (
														<Button
															variant="danger"
															size="sm"
															onClick={() => handleAction(bank._id, "deactivate")}
															disabled={mutation.isPending}
														>
															Deactivate
														</Button>
													)}
													{bank.status === "inactive" && (
														<Button
															variant="cta"
															size="sm"
															onClick={() => handleAction(bank._id, "activate")}
															disabled={mutation.isPending}
														>
															Activate
														</Button>
													)}
												</div>
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
