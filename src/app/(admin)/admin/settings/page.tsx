"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface GlobalSetting {
	maintenanceMode: boolean;
	globalMinWithdrawal: number;
	globalMaxWithdrawal: number;
	announcementMessage: string;
	depositUpiIds: string[];
}

export default function GlobalSettingsPage() {
	const queryClient = useQueryClient();

	const defaultSettings: GlobalSetting = {
		maintenanceMode: false,
		globalMinWithdrawal: 100,
		globalMaxWithdrawal: 50000,
		announcementMessage: "",
		depositUpiIds: [],
	};

	const [draftData, setDraftData] = useState<GlobalSetting | null>(null);

	const [newUpi, setNewUpi] = useState("");

	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["admin-global-settings"],
		queryFn: async () => {
			const res = await axios.get("/api/admin/settings");
			return res.data?.data as GlobalSetting;
		},
	});

	const formData = draftData ?? data ?? defaultSettings;
	const setFormData = setDraftData;

	const mutation = useMutation({
		mutationFn: async (payload: GlobalSetting) => {
			const res = await axios.patch("/api/admin/settings", payload);
			return res.data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-global-settings"] });
			alert("Global settings updated successfully!");
		},
		onError: (err: any) => {
			alert(err?.response?.data?.message || "Failed to update settings");
		},
	});

	const handleAddUpi = () => {
		if (newUpi.trim() && !formData.depositUpiIds.includes(newUpi.trim())) {
			setFormData({
				...formData,
				depositUpiIds: [...formData.depositUpiIds, newUpi.trim()],
			});
			setNewUpi("");
		}
	};

	const handleRemoveUpi = (upi: string) => {
		setFormData({
			...formData,
			depositUpiIds: formData.depositUpiIds.filter((id) => id !== upi),
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		mutation.mutate(formData);
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-20">
				<Spinner size="lg" />
			</div>
		);
	}

	if (isError) {
		return (
			<div className="text-destructive py-4 text-center">
				Error loading settings. {(error as any)?.message}
			</div>
		);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-semibold text-foreground">Global Settings</h1>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* Maintenance Mode */}
				<Card className="p-6">
					<h2 className="text-lg font-semibold text-foreground mb-4">System Status</h2>
					<div className="flex items-center justify-between">
						<div>
							<div className="font-medium text-foreground">Maintenance Mode</div>
							<div className="text-sm text-muted">
								When enabled, agents will see a maintenance screen and will not be able to perform actions.
							</div>
						</div>
						<div className="flex items-center">
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									checked={formData.maintenanceMode}
									onChange={(e) =>
										setFormData({ ...formData, maintenanceMode: e.target.checked })
									}
								/>
								<div className="w-11 h-6 bg-card-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-gold border border-border"></div>
							</label>
						</div>
					</div>
				</Card>

				{/* Financial Rules */}
				<Card className="p-6">
					<h2 className="text-lg font-semibold text-foreground mb-4">Global Financial Rules</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div className="space-y-2">
							<Input
								label="Global Minimum Withdrawal (₹)"
								type="number"
								min="1"
								value={formData.globalMinWithdrawal}
								onChange={(e) =>
									setFormData({ ...formData, globalMinWithdrawal: Number(e.target.value) })
								}
								required
							/>
						</div>
						<div className="space-y-2">
							<Input
								label="Global Maximum Withdrawal (₹)"
								type="number"
								min="1"
								value={formData.globalMaxWithdrawal}
								onChange={(e) =>
									setFormData({ ...formData, globalMaxWithdrawal: Number(e.target.value) })
								}
								required
							/>
						</div>
					</div>
				</Card>

				{/* Deposit UPI IDs */}
				<Card className="p-6">
					<h2 className="text-lg font-semibold text-foreground mb-4">Deposit UPI IDs</h2>
					<p className="text-sm text-muted mb-4">
						Configure the UPI IDs that agents can use to make security deposits.
					</p>
					
					<div className="space-y-4">
						<div className="flex gap-3">
							<Input
								className="flex-1"
								placeholder="e.g. admin@upi or 9876543210@paytm"
								value={newUpi}
								onChange={(e) => setNewUpi(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										handleAddUpi();
									}
								}}
							/>
							<Button type="button" variant="secondary" onClick={handleAddUpi}>
								Add UPI
							</Button>
						</div>

						{formData.depositUpiIds.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-4">
								{formData.depositUpiIds.map((upi, idx) => (
									<div
										key={idx}
										className="flex items-center gap-2 bg-card-muted border border-border px-3 py-1.5 rounded-lg text-sm text-foreground"
									>
										<span>{upi}</span>
										<button
											type="button"
											className="text-destructive hover:text-red-400 font-bold ml-1"
											onClick={() => handleRemoveUpi(upi)}
										>
											&times;
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</Card>

				{/* Announcements */}
				<Card className="p-6">
					<h2 className="text-lg font-semibold text-foreground mb-4">Platform Announcement</h2>
					<div className="space-y-2">
						<Input
							label="Announcement Banner Message (Optional)"
							placeholder="e.g. Maintenance scheduled for tonight at 12 AM."
							value={formData.announcementMessage}
							onChange={(e) =>
								setFormData({ ...formData, announcementMessage: e.target.value })
							}
						/>
						<p className="text-xs text-muted">
							Leave this blank to hide the announcement banner on the agent dashboard.
						</p>
					</div>
				</Card>

				<div className="flex justify-end pb-10">
					<Button type="submit" variant="cta" disabled={mutation.isPending}>
						{mutation.isPending ? "Saving..." : "Save Global Settings"}
					</Button>
				</div>
			</form>
		</div>
	);
}
