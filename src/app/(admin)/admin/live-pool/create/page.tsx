"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface BankAccount {
	_id: string;
	accountNumber: string;
	bankName: string;
	userId?: {
		name: string;
		phone: string;
	};
}

export default function CreateLivePoolJobPage() {
	const router = useRouter();

	const [amount, setAmount] = useState("");
	const [expiryMinutes, setExpiryMinutes] = useState("15");
	const [bankId, setBankId] = useState("");

	// Fetch active banks for the dropdown
	const { data: banksData, isLoading: isLoadingBanks } = useQuery({
		queryKey: ["admin-banks", "active"],
		queryFn: async () => {
			// Fetch up to 100 active banks for selection
			const res = await axios.get("/api/admin/banks", {
				params: { status: "active", limit: 100 },
			});
			return res.data?.data as BankAccount[];
		},
	});

	const mutation = useMutation({
		mutationFn: async (payload: { bankId: string; amount: number; expiryMinutes: number }) => {
			const res = await axios.post("/api/admin/live-pool", payload);
			return res.data;
		},
		onSuccess: () => {
			alert("Live pool job created and broadcasted successfully!");
			router.push("/admin/live-pool");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to create live pool job");
		},
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (!bankId) return alert("Please select a bank account.");
		if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return alert("Please enter a valid amount.");
		if (!expiryMinutes || isNaN(Number(expiryMinutes)) || Number(expiryMinutes) <= 0) return alert("Please enter a valid expiry duration.");

		mutation.mutate({
			bankId,
			amount: Number(amount),
			expiryMinutes: Number(expiryMinutes),
		});
	};

	return (
		<div className="space-y-6 max-w-2xl mx-auto">
			<div className="flex items-center space-x-4">
				<Button
					variant="ghost"
					className="text-muted hover:text-foreground px-0"
					onClick={() => router.back()}
				>
					&larr; Back
				</Button>
			</div>

			<Card className="p-6 sm:p-8">
				<h1 className="text-2xl font-semibold text-foreground mb-2">Create Live Pool Job</h1>
				<p className="text-muted text-sm mb-8">
					Dispatch a new deposit request to the live pool. Agents will receive a real-time notification to grab it.
				</p>

				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-2">
						<label className="block text-sm font-medium text-foreground">
							Target Bank Account
						</label>
						{isLoadingBanks ? (
							<div className="h-10 border border-border rounded-lg bg-card flex items-center px-3 text-muted">
								<Spinner size="sm" className="mr-2" /> Loading banks...
							</div>
						) : (
							<select
								className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground outline-none focus:border-accent-gold"
								value={bankId}
								onChange={(e) => setBankId(e.target.value)}
								required
							>
								<option value="">-- Select an active bank --</option>
								{banksData?.map((bank) => (
									<option key={bank._id} value={bank._id}>
										{bank.bankName} - {bank.accountNumber} ({bank.userId?.name || "Unknown Agent"})
									</option>
								))}
							</select>
						)}
						<p className="text-xs text-muted">
							Select the bank account where the user is expected to transfer funds.
						</p>
					</div>

					<div className="space-y-2">
						<Input
							label="Deposit Amount (₹)"
							type="number"
							placeholder="e.g. 5000"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							required
							min="1"
						/>
					</div>

					<div className="space-y-2">
						<Input
							label="Expiry Duration (Minutes)"
							type="number"
							placeholder="15"
							value={expiryMinutes}
							onChange={(e) => setExpiryMinutes(e.target.value)}
							required
							min="1"
							max="1440"
						/>
						<p className="text-xs text-muted">
							The job will automatically expire if not grabbed within this time.
						</p>
					</div>

					<div className="pt-4 flex gap-4">
						<Button
							type="submit"
							variant="cta"
							className="flex-1"
							disabled={mutation.isPending || isLoadingBanks}
						>
							{mutation.isPending ? "Broadcasting..." : "Dispatch Job to Pool"}
						</Button>
						<Link href="/admin/live-pool" className="flex-1">
							<Button variant="secondary" className="w-full">
								Cancel
							</Button>
						</Link>
					</div>
				</form>
			</Card>
		</div>
	);
}
