import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import CreateListingForm from "@/components/listings/CreateListingForm";
import CreateListingGuard from "@/components/listings/CreateListingGuard";
import { getAgentListingStatus } from "@/lib/rateCards";

export const metadata = {
  title: "Create Property Listing",
  description: "Create a new property listing",
};

export default async function CreateListingPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=/crm/create-listing");
  }

  // Check user role and approval status
  const [user] = await query<{ role: string }>(
    `SELECT role FROM user WHERE id = ?`,
    [session.user.id]
  );

  const userRole = user?.role || "USER";
  let hasApprovedApplication = false;

  if (userRole !== "AGENT" && userRole !== "ADMIN") {
    const approvedApps = await query<{ id: string }>(
      `SELECT id FROM agent_approval WHERE userId = ? AND status = 'APPROVED'`,
      [session.user.id]
    ).catch(() => [] as { id: string }[]);

    hasApprovedApplication = approvedApps.length > 0;

    // Auto-upgrade if they have an approved application
    if (hasApprovedApplication) {
      await query(
        `UPDATE user SET role = 'AGENT', updatedAt = NOW() WHERE id = ? AND role = 'USER'`,
        [session.user.id]
      );
    }
  }

  const canCreateListing = userRole === "AGENT" || userRole === "ADMIN" || hasApprovedApplication;
  const listingStatus =
    canCreateListing && userRole !== "ADMIN"
      ? await getAgentListingStatus(session.user.id)
      : null;
  const atQuota =
    listingStatus !== null && !listingStatus.canCreateListing;

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Listing
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Fill out the form below to create a new property listing. All
            required fields are marked with an asterisk (*).
          </p>
          {listingStatus && (
            <p className="mt-2 text-sm text-gray-500">
              Listings used:{" "}
              <strong>
                {listingStatus.listingCount} / {listingStatus.listingQuota}
              </strong>
              {listingStatus.rateCardTier !== "NONE" && (
                <>
                  {" "}
                  · Tier: <strong>{listingStatus.rateCardTier}</strong>
                </>
              )}
            </p>
          )}
        </div>

        {atQuota ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center max-w-lg mx-auto">
            <h2 className="text-xl font-semibold text-amber-900 mb-2">
              Listing limit reached
            </h2>
            <p className="text-sm text-amber-800 mb-4">
              You have used all {listingStatus?.listingQuota} listings allowed
              on your current plan. Upgrade your rate card to list more
              properties.
            </p>
            <Link
              href="/crm/rate-cards"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#468AD1] text-white text-sm font-medium hover:bg-[#2F6FAE]"
            >
              View rate cards &amp; upgrade
            </Link>
          </div>
        ) : canCreateListing ? (
          <CreateListingForm />
        ) : (
          <CreateListingGuard />
        )}
      </div>
    </div>
  );
}
