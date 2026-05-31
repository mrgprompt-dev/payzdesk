import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import GlobalSetting from "@/models/GlobalSetting";
import { getAdminUser } from "@/lib/getAdminUser";

// Helper to ensure there's always one setting document
async function getOrCreateGlobalSetting() {
	const setting = await GlobalSetting.findOne();
	if (!setting) {
		return GlobalSetting.create({});
	}
	return setting;
}

function toFiniteNumber(value: unknown, label: string) {
	const numberValue = Number(value);
	if (!Number.isFinite(numberValue) || numberValue < 0) {
		throw new Error(`INVALID_${label}`);
	}
	return numberValue;
}

export async function GET(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const setting = await getOrCreateGlobalSetting();

		return NextResponse.json({
			success: true,
			data: setting,
		});
	} catch (error) {
		console.error("[GET /api/admin/settings]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}

export async function PATCH(req: NextRequest) {
	try {
		const payload = await getAdminUser(req);
		if (!payload) {
			return NextResponse.json(
				{ success: false, message: "Not authenticated" },
				{ status: 401 },
			);
		}

		await connectDB();
		const body = await req.json();

		const {
			maintenanceMode,
			globalMinWithdrawal,
			globalMaxWithdrawal,
			defaultMaxWithdrawal,
			performanceCommissionRate,
			referralCommissionRate,
			announcementMessage,
			depositUpiIds,
			tiers,
		} = body;

		const setting = await getOrCreateGlobalSetting();

		if (maintenanceMode !== undefined) setting.maintenanceMode = Boolean(maintenanceMode);
		if (globalMinWithdrawal !== undefined) {
			setting.globalMinWithdrawal = toFiniteNumber(globalMinWithdrawal, "GLOBAL_MIN_WITHDRAWAL");
		}
		if (globalMaxWithdrawal !== undefined) {
			setting.globalMaxWithdrawal = toFiniteNumber(globalMaxWithdrawal, "GLOBAL_MAX_WITHDRAWAL");
		}
		if (defaultMaxWithdrawal !== undefined) {
			setting.defaultMaxWithdrawal = toFiniteNumber(defaultMaxWithdrawal, "DEFAULT_MAX_WITHDRAWAL");
		}
		if (performanceCommissionRate !== undefined) {
			setting.performanceCommissionRate = toFiniteNumber(
				performanceCommissionRate,
				"PERFORMANCE_COMMISSION_RATE",
			);
		}
		if (referralCommissionRate !== undefined) {
			setting.referralCommissionRate = toFiniteNumber(
				referralCommissionRate,
				"REFERRAL_COMMISSION_RATE",
			);
		}
		if (setting.globalMinWithdrawal > setting.globalMaxWithdrawal) {
			return NextResponse.json(
				{ success: false, message: "Minimum withdrawal cannot exceed maximum withdrawal" },
				{ status: 400 },
			);
		}
		if (announcementMessage !== undefined) {
			setting.announcementMessage = String(announcementMessage).trim().slice(0, 500);
		}
		if (Array.isArray(depositUpiIds)) {
			setting.depositUpiIds = [
				...new Set(
					depositUpiIds
						.map((upi) => String(upi).trim())
						.filter((upi) => upi.length > 0 && upi.length <= 100),
				),
			];
		}
		if (Array.isArray(tiers)) {
			setting.tiers = tiers.map((tier) => ({
				name: String(tier.name || "").trim(),
				minDeposit: toFiniteNumber(tier.minDeposit, "TIER_MIN_DEPOSIT"),
				commissionRate: toFiniteNumber(tier.commissionRate, "TIER_COMMISSION_RATE"),
				withdrawalLimit: toFiniteNumber(tier.withdrawalLimit, "TIER_WITHDRAWAL_LIMIT"),
			}));
		}

		await setting.save();

		return NextResponse.json({
			success: true,
			message: "Global settings updated successfully",
			data: setting,
		});
	} catch (error) {
		if (error instanceof Error && error.message.startsWith("INVALID_")) {
			return NextResponse.json(
				{ success: false, message: "Invalid numeric setting value" },
				{ status: 400 },
			);
		}
		console.error("[PATCH /api/admin/settings]", error);
		return NextResponse.json(
			{ success: false, message: "Server error" },
			{ status: 500 },
		);
	}
}
