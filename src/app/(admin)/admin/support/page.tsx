"use client";

import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SupportTicket {
	_id: string;
	subject: string;
	status: string;
	createdAt: string;
	userId?: {
		_id: string;
		name: string;
		phone: string;
	};
}

export default function SupportTicketsPage() {
	const router = useRouter();
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState("all");
	const [page, setPage] = useState(1);
	const limit = 20;

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["admin-support", page, search, status],
		queryFn: async () => {
			const res = await axios.get("/api/admin/support", {
				params: { page, limit, search, status },
			});
			return res.data;
		},
		placeholderData: keepPreviousData,
	});

	return (
		<div className="space-y-6">
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<h1 className="text-2xl font-semibold text-foreground">Support Tickets</h1>
			</div>

			<Card className="p-4 sm:p-6 shadow-none">
				<div className="flex flex-col sm:flex-row gap-4 mb-6">
					<div className="flex-1">
						<Input
							placeholder="Search by agent name or phone..."
							value={search}
							onChange={(e) => {
								setSearch(e.target.value);
								setPage(1);
							}}
						/>
					</div>
					<div className="w-full sm:w-48">
						<select
							className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent-gold"
							value={status}
							onChange={(e) => {
								setStatus(e.target.value);
								setPage(1);
							}}
						>
							<option value="all">All Status</option>
							<option value="open">Open</option>
							<option value="closed">Closed</option>
						</select>
					</div>
				</div>

				{isLoading ? (
					<div className="flex justify-center items-center py-12">
						<Spinner size="lg" />
					</div>
				) : isError ? (
					<div className="text-destructive py-4 text-center">
						Error loading tickets. {(error as any)?.message}
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-sm whitespace-nowrap">
							<thead>
								<tr className="border-b border-border text-muted">
									<th className="pb-3 font-medium">Ticket ID</th>
									<th className="pb-3 font-medium">Agent</th>
									<th className="pb-3 font-medium">Subject</th>
									<th className="pb-3 font-medium text-center">Status</th>
									<th className="pb-3 font-medium">Created Date</th>
									<th className="pb-3 font-medium text-right">Actions</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{data?.data?.length === 0 ? (
									<tr>
										<td colSpan={6} className="py-6 text-center text-muted">
											No support tickets found.
										</td>
									</tr>
								) : (
									data?.data?.map((ticket: SupportTicket) => (
										<tr key={ticket._id} className="hover:bg-card/50">
											<td className="py-3 font-mono text-xs text-muted">
												{ticket._id.slice(-6).toUpperCase()}
											</td>
											<td className="py-3">
												{ticket.userId ? (
													<>
														<div className="font-medium text-foreground">
															<Link href={`/admin/agents/${ticket.userId._id}`} className="hover:underline">
																{ticket.userId.name}
															</Link>
														</div>
														<div className="text-xs text-muted">{ticket.userId.phone}</div>
													</>
												) : (
													<span className="text-muted text-xs">N/A</span>
												)}
											</td>
											<td className="py-3 text-foreground font-medium max-w-[200px] truncate">
												{ticket.subject}
											</td>
											<td className="py-3 text-center">
												<Badge variant={ticket.status === "open" ? "gold" : "default"}>
													{ticket.status.toUpperCase()}
												</Badge>
											</td>
											<td className="py-3 text-muted">
												{new Date(ticket.createdAt).toLocaleDateString()}{" "}
												{new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
											</td>
											<td className="py-3 text-right">
												<Button
													variant="secondary"
													size="sm"
													onClick={() => router.push(`/admin/support/${ticket._id}`)}
												>
													View Thread
												</Button>
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
							<Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
							<Button variant="secondary" size="sm" disabled={page === data.pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
						</div>
					</div>
				)}
			</Card>
		</div>
	);
}
