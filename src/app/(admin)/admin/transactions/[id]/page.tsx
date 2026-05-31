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
import { useParams, useRouter } from "next/navigation";

interface TransactionDetail {
	_id: string;
	type: string;
	amount: number;
	status: string;
	createdAt: string;
	referenceId?: string;
	utrNumber?: string;
	notes?: string;
	userId?: {
		_id: string;
		name: string;
		phone: string;
		netBalance: number;
	};
	bankId?: {
		bankName: string;
		accountNumber: string;
		ifscCode: string;
	};
}

export default function TransactionDetailPage() {
	const params = useParams();
	const id = params.id as string;
	const queryClient = useQueryClient();
	const router = useRouter();

	const [note, setNote] = useState("");
	const [showRejectInput, setShowRejectInput] = useState(false);

	const { data, isLoading, isError } = useQuery<TransactionDetail>({
		queryKey: ["admin-transaction-detail", id],
		queryFn: async () => {
			const res = await axios.get(`/api/admin/transactions/${id}`);
			return res.data?.data;
		},
	});

	const mutation = useMutation({
		mutationFn: async (updates: { action: "approve" | "reject"; note?: string }) => {
			const res = await axios.patch(`/api/admin/transactions/${id}`, updates);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-transaction-detail", id] });
			queryClient.invalidateQueries({ queryKey: ["admin-transactions"] });
			setShowRejectInput(false);
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to process transaction");
		},
	});

	const handleApprove = () => {
		if (confirm("Are you sure you want to approve this transaction?")) {
			mutation.mutate({ action: "approve" });
		}
	};

	const handleReject = () => {
		if (!showRejectInput) {
			setShowRejectInput(true);
			return;
		}
		if (!note.trim()) {
			alert("Please enter a reason for rejection.");
			return;
		}
		if (confirm("Are you sure you want to reject this transaction?")) {
			mutation.mutate({ action: "reject", note: note.trim() });
		}
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
				Error loading transaction details.
			</div>
		);
	}

	const txn = data;
	const isPending = txn.status === "pending";

	return (
		<div className="space-y-6">
			<div className="flex items-center space-x-4">
				<Button
					variant="ghost"
					className="text-muted hover:text-foreground px-0"
					onClick={() => router.back()}
				>
					&larr; Back
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="col-span-1 lg:col-span-2 space-y-6">
					<Card className="p-6">
						<div className="flex justify-between items-start mb-6">
							<div>
								<h2 className="text-xl font-semibold text-foreground capitalize">
									{txn.type.replace('_', ' ')} Details
								</h2>
								<p className="text-sm text-muted">
									ID: {txn._id}
								</p>
							</div>
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
								className="text-sm px-3 py-1"
							>
								{txn.status}
							</Badge>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
							<div>
								<span className="block text-muted mb-1">Amount</span>
								<span className="font-semibold text-lg text-foreground">
									₹{txn.amount.toLocaleString("en-IN")}
								</span>
							</div>
							<div>
								<span className="block text-muted mb-1">Date Submitted</span>
								<span className="text-foreground">
									{new Date(txn.createdAt).toLocaleString()}
								</span>
							</div>
							{txn.referenceId && (
								<div>
									<span className="block text-muted mb-1">Reference ID</span>
									<span className="text-foreground">{txn.referenceId}</span>
								</div>
							)}
							{txn.utrNumber && (
								<div>
									<span className="block text-muted mb-1">UTR Number</span>
									<span className="text-foreground">{txn.utrNumber}</span>
								</div>
							)}
							{txn.notes && (
								<div className="col-span-1 md:col-span-2">
									<span className="block text-muted mb-1">Notes / Rejection Reason</span>
									<p className="text-foreground bg-card-muted p-3 rounded-md border border-border">
										{txn.notes}
									</p>
								</div>
							)}
						</div>
					</Card>

					{txn.bankId && (
						<Card className="p-6">
							<h3 className="text-lg font-semibold text-foreground mb-4">Bank Information</h3>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
								<div>
									<span className="block text-muted mb-1">Bank Name</span>
									<span className="text-foreground font-medium">{txn.bankId.bankName}</span>
								</div>
								<div>
									<span className="block text-muted mb-1">Account Number</span>
									<span className="text-foreground">{txn.bankId.accountNumber}</span>
								</div>
								<div>
									<span className="block text-muted mb-1">IFSC Code</span>
									<span className="text-foreground">{txn.bankId.ifscCode}</span>
								</div>
							</div>
						</Card>
					)}
				</div>

				<div className="col-span-1 space-y-6">
					<Card className="p-6">
						<h3 className="text-lg font-semibold text-foreground mb-4">Agent Information</h3>
						{txn.userId ? (
							<div className="space-y-4 text-sm">
								<div>
									<span className="block text-muted mb-1">Name</span>
									<span className="text-foreground font-medium">{txn.userId.name}</span>
								</div>
								<div>
									<span className="block text-muted mb-1">Phone</span>
									<span className="text-foreground">{txn.userId.phone}</span>
								</div>
								<div className="pt-2 border-t border-border">
									<span className="block text-muted mb-1">Current Net Balance</span>
									<span className="text-accent-gold font-semibold text-base">
										₹{txn.userId.netBalance.toLocaleString("en-IN")}
									</span>
								</div>
								<Link href={`/admin/agents/${txn.userId._id}`} className="block mt-2 text-accent-gold hover:underline">
									View Agent Profile
								</Link>
							</div>
						) : (
							<p className="text-sm text-muted">Agent information unavailable.</p>
						)}
					</Card>

					{isPending && (
						<Card className="p-6 border-accent-gold/30 bg-accent-gold/5">
							<h3 className="text-lg font-semibold text-foreground mb-4">Action Required</h3>
							
							{showRejectInput ? (
								<div className="space-y-4">
									<Input
										label="Rejection Reason"
										placeholder="Why is this being rejected?"
										value={note}
										onChange={(e) => setNote(e.target.value)}
									/>
									<div className="flex gap-2">
										<Button 
											variant="danger" 
											className="flex-1" 
											onClick={handleReject}
											disabled={mutation.isPending}
										>
											Confirm Reject
										</Button>
										<Button 
											variant="ghost" 
											className="flex-1" 
											onClick={() => {
												setShowRejectInput(false);
												setNote("");
											}}
											disabled={mutation.isPending}
										>
											Cancel
										</Button>
									</div>
								</div>
							) : (
								<div className="flex flex-col gap-3">
									<Button 
										variant="cta" 
										className="w-full bg-accent-green hover:opacity-90 text-white"
										onClick={handleApprove}
										disabled={mutation.isPending}
									>
										Approve Transaction
									</Button>
									<Button 
										variant="danger" 
										className="w-full"
										onClick={handleReject}
										disabled={mutation.isPending}
									>
										Reject Transaction
									</Button>
								</div>
							)}
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}
