"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Reply {
	_id?: string;
	sender: "user" | "admin";
	message: string;
	createdAt: string;
}

interface SupportTicket {
	_id: string;
	subject: string;
	message: string;
	status: string;
	createdAt: string;
	replies: Reply[];
	userId?: {
		_id: string;
		name: string;
		phone: string;
		email?: string;
	};
}

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const router = useRouter();
	const { id } = use(params);
	const queryClient = useQueryClient();

	const [replyMessage, setReplyMessage] = useState("");

	const { data: ticket, isLoading, isError, error } = useQuery({
		queryKey: ["admin-support-ticket", id],
		queryFn: async () => {
			const res = await axios.get(`/api/admin/support/${id}`);
			return res.data?.data as SupportTicket;
		},
	});

	const mutation = useMutation({
		mutationFn: async (payload: { action: "reply" | "close" | "reopen"; message?: string }) => {
			const res = await axios.patch(`/api/admin/support/${id}`, payload);
			return res.data;
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ["admin-support-ticket", id] });
			queryClient.invalidateQueries({ queryKey: ["admin-support"] });
			
			if (variables.action === "reply") {
				setReplyMessage("");
			}
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to process action");
		},
	});

	const handleReplySubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!replyMessage.trim()) return;
		mutation.mutate({ action: "reply", message: replyMessage });
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (isError || !ticket) {
		return (
			<div className="text-destructive py-4 text-center">
				Error loading ticket. {(error as any)?.message}
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="flex items-center justify-between">
				<Button
					variant="ghost"
					className="text-muted hover:text-foreground px-0"
					onClick={() => router.back()}
				>
					&larr; Back to Tickets
				</Button>
				
				{ticket.status === "open" ? (
					<Button
						variant="secondary"
						className="text-destructive border-destructive hover:bg-destructive/10"
						onClick={() => {
							if (confirm("Are you sure you want to close this ticket? This will prevent further replies.")) {
								mutation.mutate({ action: "close" });
							}
						}}
						disabled={mutation.isPending}
					>
						Close Ticket
					</Button>
				) : (
					<Button
						variant="cta"
						onClick={() => {
							if (confirm("Are you sure you want to reopen this ticket?")) {
								mutation.mutate({ action: "reopen" });
							}
						}}
						disabled={mutation.isPending}
					>
						Reopen Ticket
					</Button>
				)}
			</div>

			<Card className="p-6">
				<div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-8 pb-6 border-b border-border">
					<div>
						<h1 className="text-2xl font-semibold text-foreground mb-2">
							{ticket.subject}
						</h1>
						<div className="flex items-center space-x-3 text-sm text-muted">
							<span>ID: <span className="font-mono text-foreground">{ticket._id.slice(-6).toUpperCase()}</span></span>
							<span>•</span>
							<span>{new Date(ticket.createdAt).toLocaleString()}</span>
							<span>•</span>
							<Badge variant={ticket.status === "open" ? "gold" : "default"}>
								{ticket.status.toUpperCase()}
							</Badge>
						</div>
					</div>
					
					{ticket.userId && (
						<div className="text-right bg-card-muted p-3 rounded-lg border border-border">
							<div className="text-xs text-muted mb-1">Raised by Agent</div>
							<div className="font-medium text-foreground">
								<Link href={`/admin/agents/${ticket.userId._id}`} className="hover:underline">
									{ticket.userId.name}
								</Link>
							</div>
							<div className="text-sm text-muted">{ticket.userId.phone}</div>
							{ticket.userId.email && <div className="text-sm text-muted">{ticket.userId.email}</div>}
						</div>
					)}
				</div>

				{/* Chat Thread */}
				<div className="space-y-6 mb-8">
					{/* Original Message */}
					<div className="flex flex-col space-y-1 items-start">
						<span className="text-xs text-muted font-medium ml-1">
							{ticket.userId?.name || "Agent"} • {new Date(ticket.createdAt).toLocaleString()}
						</span>
						<div className="bg-card-muted border border-border p-4 rounded-2xl rounded-tl-sm max-w-[85%] text-foreground whitespace-pre-wrap">
							{ticket.message}
						</div>
					</div>

					{/* Replies */}
					{ticket.replies?.map((reply, idx) => {
						const isAdmin = reply.sender === "admin";
						return (
							<div key={idx} className={`flex flex-col space-y-1 ${isAdmin ? "items-end" : "items-start"}`}>
								<span className={`text-xs text-muted font-medium ${isAdmin ? "mr-1" : "ml-1"}`}>
									{isAdmin ? "Admin (You)" : (ticket.userId?.name || "Agent")} • {new Date(reply.createdAt).toLocaleString()}
								</span>
								<div className={`p-4 rounded-2xl max-w-[85%] text-foreground whitespace-pre-wrap ${
									isAdmin 
										? "bg-accent-gold/10 border border-accent-gold/20 rounded-tr-sm" 
										: "bg-card-muted border border-border rounded-tl-sm"
								}`}>
									{reply.message}
								</div>
							</div>
						);
					})}
				</div>

				{/* Reply Form */}
				{ticket.status === "open" ? (
					<form onSubmit={handleReplySubmit} className="mt-8 pt-6 border-t border-border">
						<h3 className="text-sm font-medium text-foreground mb-3">Add a Reply</h3>
						<div className="flex gap-3">
							<Input
								className="flex-1"
								placeholder="Type your response to the agent here..."
								value={replyMessage}
								onChange={(e) => setReplyMessage(e.target.value)}
								disabled={mutation.isPending}
							/>
							<Button type="submit" variant="cta" disabled={!replyMessage.trim() || mutation.isPending}>
								{mutation.isPending && mutation.variables?.action === "reply" ? "Sending..." : "Send Reply"}
							</Button>
						</div>
					</form>
				) : (
					<div className="mt-8 pt-6 border-t border-border text-center">
						<p className="text-muted text-sm bg-card-muted py-3 rounded-lg">
							This ticket is closed. Reopen the ticket to add a new reply.
						</p>
					</div>
				)}
			</Card>
		</div>
	);
}
