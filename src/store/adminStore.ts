import { create } from "zustand";
import type { IAdmin } from "@/types";

interface AdminState {
	admin: IAdmin | null;
	isLoading: boolean;
	fetchMe: () => Promise<void>;
	logout: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
	admin: null,
	isLoading: false,

	fetchMe: async () => {
		set({ isLoading: true });
		try {
			const res = await fetch("/api/admin/auth/me");
			if (!res.ok) {
				set({ admin: null, isLoading: false });
				return;
			}
			const json = await res.json();
			set({ admin: json.data?.admin ?? null, isLoading: false });
		} catch {
			set({ admin: null, isLoading: false });
		}
	},

	// Logout clears state — the calling component handles the redirect.
	// Middleware will redirect to admin login when adminToken cookie is gone.
	logout: async () => {
		try {
			await fetch("/api/admin/auth/logout", { method: "POST" });
		} finally {
			set({ admin: null });
			// Redirect to /admin — middleware will catch missing cookie
			// and forward to the secret admin login URL automatically.
			window.location.href = "/admin";
		}
	},
}));
