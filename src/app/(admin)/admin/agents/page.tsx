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

interface Agent {
	_id: string;
	phone: string;
	name: string;
	isActive: boolean;
	netBalance: number;
	createdAt: string;
}

interface AgentsResponse {
	success: boolean;
	data: Agent[];
	pagination: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
}

export default function AgentsPage() {
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;

	const { data, isLoading, isError, error } = useQuery<AgentsResponse>({
		queryKey: ["admin-agents", page, search, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/agents", {
				params: { page, limit, search, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Agents</h1>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Search by phone or name..."
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
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading agents. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Name</th>
									<th className="pb-3 font-medium">Phone</th>
									<th className="pb-3 font-medium text-right">Net Balance</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Joined</th>
									<th className="pb-3 font-medium text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No agents found.
										</td>
									</tr>
								) : (
									data?.data?.map((agent: Agent) => (
										<tr key={agent._id} className="hover:bg-card/50">
											<td className="py-3 text-foreground font-medium">{agent.name}</td>
											<td className="py-3 text-muted">{agent.phone}</td>
											<td className="py-3 text-right text-foreground">
												₹{agent.netBalance.toLocaleString("en-IN")}
											</td>
											<td className="py-3 text-center">
												<Badge variant={agent.isActive ? "success" : "danger"}>
													{agent.isActive ? "Active" : "Inactive"}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{new Date(agent.createdAt).toLocaleDateString()}
											</td>
											<td className="py-3 text-right">
												<Link href={`/admin/agents/${agent._id}`}>
													<Button variant="secondary" size="sm">
														View
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
