import { Suspense } from "react";
import type { Metadata } from "next";
import AiSearchResultsClient from "@/components/properties/AiSearchResultsClient";

export const metadata: Metadata = {
  title: "AI Property Search",
  description:
    "Search Kenyan properties with natural language. Describe what you want and refine with AI follow-ups.",
  robots: {
    index: false,
    follow: true,
  },
};

function AiSearchFallback() {
  return (
    <div className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-gray-600">
        <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
        <span className="text-sm text-gray-500">Loading AI search…</span>
      </div>
    </div>
  );
}

export default function AiSearchPage() {
  return (
    <Suspense fallback={<AiSearchFallback />}>
      <AiSearchResultsClient />
    </Suspense>
  );
}
