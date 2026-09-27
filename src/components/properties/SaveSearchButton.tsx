"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBookmark } from "react-icons/fi";
import { toast } from "react-hot-toast";
import {
  isSearchSaved,
  SavedSearchAuthError,
  subscribeToSavedSearchUpdates,
  toggleSavedSearch,
} from "@/lib/savedSearches";
import type { SavedSearchInput } from "@/lib/savedSearches";

interface SaveSearchButtonProps {
  search: SavedSearchInput;
}

export default function SaveSearchButton({ search }: SaveSearchButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSavedState = async () => {
      try {
        const nextIsSaved = await isSearchSaved(search.url);
        if (isMounted) {
          setIsSaved(nextIsSaved);
        }
      } catch (error) {
        if (!(error instanceof SavedSearchAuthError)) {
          console.error("Unable to load saved search state:", error);
        }
      }
    };

    loadSavedState();
    const unsubscribe = subscribeToSavedSearchUpdates(loadSavedState);

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [search.url]);

  const handleClick = async () => {
    try {
      setIsSaving(true);
      const nextIsSaved = await toggleSavedSearch(search);
      setIsSaved(nextIsSaved);
      toast.success(nextIsSaved ? "Search saved" : "Search removed");
    } catch (error) {
      if (error instanceof SavedSearchAuthError) {
        toast.error("Please sign in to save searches");
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(search.url)}`);
        return;
      }

      console.error("Unable to toggle saved search:", error);
      toast.error("Unable to update saved search");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isSaved}
      disabled={isSaving}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        isSaved
          ? "border-[#468AD1] bg-[#468AD1] text-white hover:bg-[#2F6FAE]"
          : "border-gray-200 bg-white text-gray-700 hover:border-[#468AD1] hover:text-[#468AD1]"
      }`}
    >
      <FiBookmark className="h-4 w-4" />
      <span>{isSaving ? "Saving..." : isSaved ? "Saved" : "Save Search"}</span>
    </button>
  );
}
