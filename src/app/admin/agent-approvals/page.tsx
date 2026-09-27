import { redirect } from "next/navigation";

/**
 * Legacy route — agent approvals live under User Management.
 * Keep this redirect so old bookmarks and emails still work.
 */
export default function AgentApprovalsRedirectPage() {
  redirect("/admin/users?tab=approvals");
}
