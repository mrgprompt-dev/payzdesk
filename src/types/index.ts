export interface IUser {
	_id: string;
	phone: string;
	name: string;
	email?: string;
	passwordHash: string;
	isVerified: boolean;
	isActive: boolean;
	referralCode: string;
	referredBy?: string;
	netBalance: number;
	commissionEarned: number;
	blockedDeposit: number;
	withdrawalHoldAmount: number;
	totalBanks: number;
	activeBanks: number;
	disputedWithdrawalAmount: number;
	withdrawalEnabled: boolean;
	maxWithdrawalPerTxn: number;
	appLockEnabled: boolean;
	hasPinSetup: boolean;
	createdAt: string;
	updatedAt: string;
}

export type PublicUser = Omit<IUser, "passwordHash">;

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface IAdmin {
	_id: string;
	name: string;
	phone: string;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
	userId: string;
	phone: string;
	iat?: number;
	exp?: number;
}

export interface AdminTokenPayload {
	adminId: string;
	phone: string;
	iat?: number;
	exp?: number;
}

export interface LoginRequest {
	phone: string;
	password: string;
}

export interface RegisterRequest {
	phone: string;
	name: string;
	password: string;
	referralCode?: string;
}

export interface OtpSendRequest {
	phone: string;
	purpose: "register" | "login" | "forgot-password" | "bank-verify";
}

export interface OtpVerifyRequest {
	phone: string;
	otp: string;
	purpose: "register" | "login" | "forgot-password" | "bank-verify";
}

// ─── Bank Account ─────────────────────────────────────────────────────────────

export interface IBankAccount {
	_id: string;
	userId: string;
	accountNumber: string;
	upiId: string;
	accountHolderName: string;
	ifscCode: string;
	bankName: string;
	branch: string;
	address: string;
	phone: string;
	status: "active" | "inactive" | "pending" | "rejected";
	verified: boolean;
	createdAt: string;
	updatedAt: string;
}

// ─── Transaction ──────────────────────────────────────────────────────────────

export interface ITransaction {
	_id: string;
	userId: string;
	type: "deposit" | "withdrawal" | "security_deposit" | "security_withdrawal";
	amount: number;
	status:
		| "pending"
		| "processing"
		| "completed"
		| "failed"
		| "disputed"
		| "cancelled";
	bankId?: string;
	utrNumber?: string;
	referenceId?: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

// ─── UTR ──────────────────────────────────────────────────────────────────────

export interface IUTR {
	_id: string;
	userId: string;
	bankId: string;
	utrNumber: string;
	amount: number;
	status: "pending" | "verified" | "rejected";
	createdAt: string;
	updatedAt: string;
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
	error?: string;
}

// ─── Referral ─────────────────────────────────────────────────────────────────

export interface IReferralCycle {
	_id: string;
	userId: string;
	startDate: string;
	endDate: string;
	amount: number;
	status: "pending_payout" | "credited";
	createdAt: string;
	updatedAt: string;
}

export interface IReferralCommission {
	_id: string;
	referrerId: string;
	referredUserId: string;
	cycleId: string;
	amount: number;
	createdAt: string;
}

export interface IReferredUser {
	_id: string;
	name: string;
	phone: string;
	joinedAt: string;
	totalCommission: number;
}

export interface ReferralStats {
	lifetimeEarnings: number;
	referralCode: string;
	currentCycle: {
		_id: string;
		startDate: string;
		endDate: string;
		amount: number;
		status: "pending_payout" | "credited";
	} | null;
	referredUsers: IReferredUser[];
	commissionHistory: IReferralCommission[];
}

// ─── Performance Commission ───────────────────────────────────────────────────

export interface IActiveProgram {
	name: string;
	termsUrl?: string;
	bonusTrackerUrl?: string;
}

export interface IPerformanceCommission {
	totalEarned: number;
	status: "released" | "pending";
	lastReleasedDate: string | null;
	frequencyDays: number;
	activePrograms: IActiveProgram[];
}

// ─── Commission Details ──────────────────────────────────────────────────────

export interface CommissionDetail {
	_id: string;
	cycleId: string;
	cycleStart: string;
	cycleEnd: string;
	amount: number;
	createdAt: string;
}

export interface CommissionDetailsResponse {
	totalEarned: number;
	records: CommissionDetail[];
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export interface FinanceReportSummary {
	totalDeposits: number;
	totalWithdrawals: number;
	totalSecurityDeposits: number;
	totalSecurityWithdrawals: number;
	netBalance: number;
	pendingDeposits: number;
	pendingWithdrawals: number;
	completedDeposits: number;
	completedWithdrawals: number;
	dateFrom: string | null;
	dateTo: string | null;
}

export interface IAdjustment {
	_id: string;
	type: "credit" | "debit";
	amount: number;
	description: string;
	referenceId?: string;
	createdAt: string;
}

export interface AdjustmentsResponse {
	totalCredit: number;
	totalDebit: number;
	net: number;
	records: IAdjustment[];
}

// ─── Tiers ────────────────────────────────────────────────────────────────────

export interface ITierBenefit {
	label: string;
	value: string;
}

export interface ITier {
	id: string;
	name: string;
	minDeposit: number;
	maxWithdrawalPerTxn: number;
	commissionRate: number;
	color: string;
	benefits: ITierBenefit[];
}

export interface TiersResponse {
	allTiers: ITier[];
	currentTier: ITier;
	nextTier: ITier | null;
	progressPercent: number;
	totalCompletedDeposits: number;
}

// ─── Admin Stats ──────────────────────────────────────────────────────────────

export interface AdminStats {
	totalAgents: number;
	pendingDeposits: number;
	pendingWithdrawals: number;
	pendingUTRs: number;
	pendingBanks: number;
	openTickets: number;
	activeLiveJobs: number;
}
