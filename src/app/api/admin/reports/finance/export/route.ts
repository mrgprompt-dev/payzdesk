import { NextRequest, NextResponse } from "next/server";
import { getAdminUser } from "@/lib/getAdminUser";

function escapeCsv(value: string | number) {
	const stringValue = String(value);
	if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
		return `"${stringValue.replace(/"/g, '""')}"`;
	}
	return stringValue;
}

export async function GET(req: NextRequest) {
	const payload = await getAdminUser(req);
	if (!payload) {
		return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
	}

	const reportUrl = new URL("/api/admin/reports/finance", req.url);
	const { searchParams } = new URL(req.url);
	searchParams.forEach((value, key) => reportUrl.searchParams.set(key, value));

	const reportResponse = await fetch(reportUrl, {
		headers: {
			cookie: req.headers.get("cookie") || "",
		},
	});
	const reportJson = await reportResponse.json();

	if (!reportResponse.ok || !reportJson.success) {
		return NextResponse.json(
			{ success: false, message: reportJson.message || "Failed to export report" },
			{ status: reportResponse.status },
		);
	}

	const data = reportJson.data;
	const rows = [
		["Metric", "Count", "Total"],
		["Deposits", data.deposits.count, data.deposits.total],
		["Withdrawals", data.withdrawals.count, data.withdrawals.total],
		["Security Deposits", data.securityDeposits.count, data.securityDeposits.total],
		["Security Withdrawals", data.securityWithdrawals.count, data.securityWithdrawals.total],
		["Commissions Released", data.commissionsReleased.count, data.commissionsReleased.total],
		["Adjustment Credits", data.adjustments.credit.count, data.adjustments.credit.total],
		["Adjustment Debits", data.adjustments.debit.count, data.adjustments.debit.total],
		["Adjustment Net", "", data.adjustments.net],
	];
	const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");

	return new NextResponse(csv, {
		headers: {
			"content-type": "text/csv; charset=utf-8",
			"content-disposition": 'attachment; filename="finance-report.csv"',
		},
	});
}
