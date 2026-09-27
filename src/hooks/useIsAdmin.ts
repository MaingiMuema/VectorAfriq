"use client";

import { useSession } from "next-auth/react";

/**
 * Client-side hook that reports whether the current user is an admin.
 * Used to gate inline neighbourhood guide management on public pages.
 */
export function useIsAdmin(): boolean {
  const { data: session, status } = useSession();
  return (
    status === "authenticated" &&
    session?.user?.role?.toLowerCase() === "admin"
  );
}
