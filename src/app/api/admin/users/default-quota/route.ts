import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  applyListingQuotaToFreeTierUsers,
  getDefaultListingQuota,
  getFreeTierUserCount,
  updateDefaultListingQuota,
} from "@/lib/rateCards";

const ALLOWED_QUOTAS = [5, 15, 30, 60, 100, 150, 200, 400, 1000];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const [defaultListingQuota, freeTierUserCount] = await Promise.all([
      getDefaultListingQuota(),
      getFreeTierUserCount(),
    ]);
    return NextResponse.json({ defaultListingQuota, freeTierUserCount });
  } catch (error) {
    console.error("Error fetching default listing quota:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { defaultListingQuota, applyToExisting } = body;

    const quota = Number(defaultListingQuota);
    if (!Number.isFinite(quota) || quota < 0 || quota > 10000) {
      return NextResponse.json(
        { error: "defaultListingQuota must be between 0 and 10000" },
        { status: 400 }
      );
    }
    if (!ALLOWED_QUOTAS.includes(quota) && !Number.isInteger(quota)) {
      return NextResponse.json(
        {
          error: `defaultListingQuota must be one of: ${ALLOWED_QUOTAS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    await updateDefaultListingQuota(quota);

    let updatedUsers: number | undefined;
    if (applyToExisting) {
      updatedUsers = await applyListingQuotaToFreeTierUsers(quota);
    }

    return NextResponse.json({
      defaultListingQuota: quota,
      updatedUsers,
    });
  } catch (error) {
    console.error("Error updating default listing quota:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
