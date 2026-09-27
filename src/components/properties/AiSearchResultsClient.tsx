"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiSearch,
  FiCpu,
  FiLoader,
  FiZap,
  FiAlertCircle,
  FiMapPin,
  FiHome,
  FiDollarSign,
  FiTag,
  FiInfo,
  FiArrowLeft,
  FiMessageCircle,
  FiTrendingUp,
  FiSun,
  FiCompass,
  FiBarChart2,
  FiArrowUpRight,
  FiActivity,
  FiLayers,
  FiChevronRight,
  FiRefreshCw,
  FiTarget,
} from "react-icons/fi";
import { Sparkles } from "lucide-react";
import { FaBed } from "react-icons/fa";
import { formatPrice } from "@/lib/utils";
import { getCategoryLabel } from "@/lib/search/searchUrl";
import type { Property } from "@/types";
import PropertyListView from "./PropertyListView";

interface AiResultItem {
  id: string;
  relevanceScore: number;
  reason: string;
}

interface AiCriteria {
  listingType?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  category?: string;
  features?: string[];
}

interface AiInsights {
  advice?: string;
  marketInsight?: string;
  searchTips?: string[];
  matchNotes?: string;
}

interface AiStats {
  matchCount: number;
  minPrice?: number;
  maxPrice?: number;
  avgPrice?: number;
  medianPrice?: number;
  bedroomRange?: string;
  topLocations: string[];
  categories: string[];
}

interface AiSearchResponse {
  summary: string;
  criteria: AiCriteria;
  insights?: AiInsights;
  stats?: AiStats;
  results: AiResultItem[];
  properties: Property[];
  candidateCount: number;
  model: string;
  usedFallback?: boolean;
}

const FOLLOW_UP_EXAMPLES = [
  "Show cheaper options",
  "Prefer gated community with parking",
  "Closer to the CBD",
  "At least 3 bedrooms",
];

const START_EXAMPLES = [
  "3-bedroom house in Kilimani under 50M",
  "Studio apartment for rent near Nairobi CBD",
  "Gated community with parking, 2 bedrooms",
];

export default function AiSearchResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = (searchParams.get("q") || "").trim();
  const listingType = (searchParams.get("type") || "").trim();

  const [activePrompt, setActivePrompt] = useState(initialQ);
  const [followUp, setFollowUp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AiSearchResponse | null>(null);
  /** Prompts in this session (original + follow-ups) for context. */
  const [history, setHistory] = useState<string[]>(initialQ ? [initialQ] : []);
  const resultsTopRef = useRef<HTMLDivElement>(null);
  const lastFetchedKey = useRef<string>("");

  const runSearch = useCallback(
    async (prompt: string, previousPrompt?: string) => {
      const trimmed = prompt.trim();
      if (!trimmed) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/search/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: trimmed,
            listingType: listingType || undefined,
            previousPrompt: previousPrompt || undefined,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "AI search failed. Please try again.");
        }

        setData(json as AiSearchResponse);
        setActivePrompt(trimmed);
        requestAnimationFrame(() => {
          resultsTopRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong with the AI search."
        );
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [listingType]
  );

  // Initial load / when URL q changes (new navigation from hero)
  useEffect(() => {
    const q = (searchParams.get("q") || "").trim();
    if (!q) {
      setData(null);
      setActivePrompt("");
      setHistory([]);
      lastFetchedKey.current = "";
      return;
    }

    const key = `${q}::${searchParams.get("type") || ""}`;
    if (lastFetchedKey.current === key) {
      return;
    }
    lastFetchedKey.current = key;

    setHistory([q]);
    setActivePrompt(q);
    setFollowUp("");
    void runSearch(q);
  }, [searchParams, runSearch]);

  const handleFollowUp = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = followUp.trim();
    if (!trimmed || loading) return;

    const previous =
      history.length > 0 ? history.join(" | ") : activePrompt || undefined;

    setHistory((prev) => [...prev, trimmed]);
    setFollowUp("");

    // Update URL so the page is shareable / refreshable for the latest intent
    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (listingType) params.set("type", listingType);
    // Mark as follow-up via context in history only; use replace for follow-ups
    lastFetchedKey.current = `${trimmed}::${listingType}`;
    router.replace(`/search/ai?${params.toString()}`, { scroll: false });

    await runSearch(trimmed, previous);
  };

  const handleNewSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = followUp.trim();
    if (!trimmed) return;

    const params = new URLSearchParams();
    params.set("q", trimmed);
    if (listingType) params.set("type", listingType);
    lastFetchedKey.current = "";
    setHistory([trimmed]);
    setFollowUp("");
    router.push(`/search/ai?${params.toString()}`);
  };

  const handleRetry = () => {
    if (!activePrompt) return;
    const previous = history.length > 1 ? history.join(" | ") : undefined;
    void runSearch(activePrompt, previous);
  };

  const hasQuery = Boolean(initialQ || activePrompt);

  return (
    <div className="pt-16 min-h-screen bg-gray-50">
      {/* ── Hero band ── */}
      <div className="relative overflow-hidden bg-slate-900">
        {/* Ambient glows + dot grid */}
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-brand-500/25 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-brand-600/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="container mx-auto px-4 py-8 sm:py-10 max-w-5xl relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] text-white/60 mb-5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <FiHome className="h-3.5 w-3.5" />
              Home
            </Link>
            <FiChevronRight className="h-3.5 w-3.5 text-white/30" />
            <span className="inline-flex items-center gap-1.5 text-white/90 font-medium">
              <FiCpu className="h-3.5 w-3.5 text-brand-400" />
              AI Search
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-700 text-white shadow-lg shadow-brand-500/40 ring-1 ring-white/10">
                  <Sparkles className="h-6 w-6" />
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  AI Property Search
                </h1>
              </div>
              <p className="text-sm sm:text-[15px] text-white/70 mt-2 max-w-xl leading-relaxed">
                Describe the home you want in plain language. The AI scans our
                listings, ranks the best matches, and explains why they fit —
                refine anytime with a follow-up.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-4 py-2 transition-colors"
            >
              <FiArrowLeft className="h-4 w-4" />
              Classic search
            </Link>
          </div>
        </div>
      </div>

      {/* ── Overlapping content ── */}
      <div className="container mx-auto px-4 max-w-5xl -mt-6 relative z-10 pb-16">
        {/* Search card */}
        <div className="bg-white rounded-2xl shadow-[0_16px_48px_rgba(15,23,42,0.14)] ring-1 ring-black/5 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700" />
          <div className="p-4 sm:p-6">
            <form onSubmit={handleFollowUp}>
              <label
                htmlFor="ai-follow-up"
                className="block text-sm font-semibold text-gray-800"
              >
                <span className="inline-flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                    <FiMessageCircle className="h-3.5 w-3.5" />
                  </span>
                  {hasQuery
                    ? "Ask a follow-up or refine your search"
                    : "Describe what you're looking for"}
                </span>
              </label>

              <div className="mt-3 flex flex-col lg:flex-row gap-2.5">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <FiZap className="h-5 w-5 text-brand-400" />
                  </div>
                  <input
                    id="ai-follow-up"
                    type="text"
                    value={followUp}
                    onChange={(e) => setFollowUp(e.target.value)}
                    maxLength={1000}
                    disabled={loading}
                    placeholder={
                      hasQuery
                        ? "e.g. Prefer ground floor, max 40M, with parking…"
                        : "e.g. 3-bedroom house in Kilimani under 50M"
                    }
                    className="w-full pl-10 pr-4 py-3.5 text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white disabled:opacity-60 disabled:cursor-wait transition-all"
                  />
                </div>
                <div className="flex gap-2.5 lg:flex-shrink-0">
                  <button
                    type="submit"
                    disabled={loading || !followUp.trim()}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-700 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 hover:shadow-brand-600/35 hover:brightness-105 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="h-4 w-4 animate-spin" />
                        Thinking…
                      </>
                    ) : (
                      <>
                        <FiSearch className="h-4 w-4" />
                        {hasQuery ? "Refine" : "Search"}
                      </>
                    )}
                  </button>
                  {hasQuery && (
                    <button
                      type="button"
                      onClick={handleNewSearch}
                      disabled={loading || !followUp.trim()}
                      title="Start a fresh search without previous context"
                      className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      New search
                    </button>
                  )}
                </div>
              </div>

              {/* Follow-up examples */}
              {hasQuery && !loading && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide mr-1">
                    Try:
                  </span>
                  {FOLLOW_UP_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setFollowUp(example)}
                      className="text-[11px] px-2.5 py-1 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              )}

              {/* Session history timeline */}
              {history.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Conversation
                  </p>
                  <div className="ml-1 border-l-2 border-brand-100 pl-4 space-y-3">
                    {history.map((item, index) => {
                      const isLast = index === history.length - 1;
                      return (
                        <div
                          key={`${index}-${item.slice(0, 24)}`}
                          className="relative"
                        >
                          <span
                            className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${
                              isLast
                                ? "bg-brand-500 ring-4 ring-brand-100"
                                : "bg-gray-300"
                            }`}
                          />                            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                            {index === 0
                              ? "Original prompt"
                              : `Refinement ${index}`}
                          </p>
                          <p
                            className={`text-sm mt-0.5 leading-snug ${
                              isLast
                                ? "text-gray-900 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            {item}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        <div ref={resultsTopRef} className="scroll-mt-24" />

        {/* Empty state */}
        {!hasQuery && !loading && (
          <div className="mt-8 text-center py-14 sm:py-16 bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
            <div className="relative inline-flex mx-auto mb-4">
              <span className="absolute inset-0 bg-brand-400/40 blur-2xl rounded-full" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
                <FiCpu className="h-8 w-8" />
              </span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Start an AI property search
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
              Type a description above — or tap an example to get started.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
              {START_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setFollowUp(example)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 transition-colors"
                >
                  {example}
                </button>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-gray-100">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to home
              </Link>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 space-y-5">
            {/* Thinking panel */}
            <div
              role="status"
              className="relative overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-brand-50 p-5 sm:p-6"
            >
              <div className="flex items-start gap-4">
                <span className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
                  <Sparkles className="h-5 w-5 animate-pulse" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
                    Searching with AI
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:300ms]" />
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                    Scanning listings, extracting your criteria, and ranking the
                    best matches
                    {activePrompt ? (
                      <>
                        {" "}
                        for{" "}
                        <span className="italic text-gray-700">
                          “{activePrompt}”
                        </span>
                      </>
                    ) : null}
                    .
                  </p>
                  <div className="mt-4 h-1.5 w-full bg-brand-100 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-gradient-to-r from-brand-400 to-brand-600 rounded-full animate-wave" />
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton property cards */}
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div
            role="alert"
            className="mt-8 flex items-start gap-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-4"
          >
            <FiAlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold">Search failed</p>
              <p className="mt-0.5 text-red-500 leading-relaxed">{error}</p>
              {activePrompt && (
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
                >
                  <FiRefreshCw className="h-3.5 w-3.5" />
                  Try again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="mt-8 space-y-6">
            {/* AI understanding */}
            <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-700" />
              <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="hidden sm:flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/25">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      How the AI understood your search
                    </p>
                    <p className="text-[15px] text-gray-700 leading-relaxed mt-1.5">
                      {data.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <FiBarChart2 className="h-3 w-3" />
                        {data.properties.length} ranked · scanned{" "}
                        {data.candidateCount}{" "}
                        {data.candidateCount === 1 ? "listing" : "listings"}
                      </span>
                      {data.model && (
                        <span
                          className="inline-flex items-center gap-1"
                          title={data.model}
                        >
                          <FiCpu className="h-3 w-3" />
                          {data.model.includes("/")
                            ? data.model.split("/")[0]
                            : data.model}{" "}
                          engine
                        </span>
                      )}
                      {data.usedFallback && (
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <FiInfo className="h-3 w-3" />
                          Filter-based ranking (AI unavailable)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Criteria */}
            {hasCriteria(data.criteria) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FiTarget className="h-3.5 w-3.5 text-brand-500" />
                  Detected criteria
                </p>
                <div className="flex flex-wrap gap-2">
                  {data.criteria.listingType && (
                    <Chip
                      icon={<FiHome className="h-3 w-3" />}
                      label={data.criteria.listingType}
                    />
                  )}
                  {data.criteria.location && (
                    <Chip
                      icon={<FiMapPin className="h-3 w-3" />}
                      label={data.criteria.location}
                    />
                  )}
                  {(data.criteria.minPrice || data.criteria.maxPrice) && (
                    <Chip
                      icon={<FiDollarSign className="h-3 w-3" />}
                      label={priceLabel(
                        data.criteria.minPrice,
                        data.criteria.maxPrice
                      )}
                    />
                  )}
                  {data.criteria.bedrooms !== undefined && (
                    <Chip
                      icon={<FaBed className="h-3 w-3" />}
                      label={
                        data.criteria.bedrooms === 0
                          ? "Studio"
                          : `${data.criteria.bedrooms}+ beds`
                      }
                    />
                  )}
                  {data.criteria.category && (
                    <Chip
                      icon={<FiTag className="h-3 w-3" />}
                      label={getCategoryLabel(data.criteria.category)}
                    />
                  )}
                  {data.criteria.features?.map((f) => (
                    <Chip key={f} label={f} />
                  ))}
                </div>
              </div>
            )}

            {/* Match stats from ranked set */}
            {data.stats && data.stats.matchCount > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <FiBarChart2 className="h-3.5 w-3.5 text-brand-500" />
                  Snapshot of your matches
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatCard
                    icon={<FiLayers className="h-4 w-4" />}
                    label="Matches"
                    value={String(data.stats.matchCount)}
                  />
                  {data.stats.avgPrice != null && (
                    <StatCard
                      icon={<FiTrendingUp className="h-4 w-4" />}
                      label="Avg price"
                      value={formatPrice(data.stats.avgPrice)}
                    />
                  )}
                  {data.stats.minPrice != null && data.stats.maxPrice != null && (
                    <StatCard
                      icon={<FiActivity className="h-4 w-4" />}
                      label="Price range"
                      value={`${compactKes(
                        data.stats.minPrice
                      )} – ${compactKes(data.stats.maxPrice)}`}
                    />
                  )}
                  {data.stats.bedroomRange && (
                    <StatCard
                      icon={<FaBed className="h-4 w-4" />}
                      label="Bedrooms"
                      value={data.stats.bedroomRange}
                    />
                  )}
                </div>
                {(data.stats.topLocations.length > 0 ||
                  data.stats.categories.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {data.stats.topLocations.map((loc) => (
                      <Chip
                        key={loc}
                        icon={<FiMapPin className="h-3 w-3" />}
                        label={loc}
                      />
                    ))}
                    {data.stats.categories.map((cat) => (
                      <Chip
                        key={cat}
                        icon={<FiTag className="h-3 w-3" />}
                        label={getCategoryLabel(cat)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI guidance beyond listings */}
            {(data.insights?.advice ||
              data.insights?.marketInsight ||
              data.insights?.matchNotes ||
              (data.insights?.searchTips &&
                data.insights.searchTips.length > 0)) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.insights?.advice && (
                  <InsightCard
                    icon={<FiSun className="h-4 w-4" />}
                    title="Advice for you"
                    body={data.insights.advice}
                    tone="amber"
                  />
                )}
                {data.insights?.marketInsight && (
                  <InsightCard
                    icon={<FiTrendingUp className="h-4 w-4" />}
                    title="Market insight"
                    body={data.insights.marketInsight}
                    tone="emerald"
                  />
                )}
                {data.insights?.matchNotes && (
                  <InsightCard
                    icon={<FiCompass className="h-4 w-4" />}
                    title="How these matches fit"
                    body={data.insights.matchNotes}
                    tone="blue"
                  />
                )}
                {data.insights?.searchTips &&
                  data.insights.searchTips.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:col-span-2">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-3">
                        <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                          <FiZap className="h-3.5 w-3.5" />
                        </span>
                        Ways to refine
                      </p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {data.insights.searchTips.map((tip) => (
                          <li key={tip}>
                            <button
                              type="button"
                              onClick={() => setFollowUp(tip)}
                              className="group w-full flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-brand-50 hover:border-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 px-3.5 py-2.5 text-left transition-all"
                            >
                              <span className="text-sm text-gray-700 group-hover:text-brand-800 leading-snug">
                                {tip}
                              </span>
                              <FiArrowUpRight className="h-4 w-4 flex-shrink-0 text-gray-300 group-hover:text-brand-500 transition-colors" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-gray-500 mt-3">
                        Tap a tip to use it as a follow-up above.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Ranked properties */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-brand-50 text-brand-600">
                    <FiZap className="h-4 w-4" />
                  </span>
                  Most relevant properties
                  {data.properties.length > 0 && (
                    <span className="text-xs font-normal text-gray-500">
                      ({data.properties.length})
                    </span>
                  )}
                </h2>
                {data.properties.length > 0 && (
                  <span className="text-[11px] text-gray-500">
                    Sorted by match score
                  </span>
                )}
              </div>

              {data.properties.length > 0 ? (
                <div className="space-y-5">
                  {data.properties.map((property, index) => {
                    const rank = data.results.find(
                      (r) => r.id === property.id
                    );
                    const score = rank?.relevanceScore ?? 0;
                    return (
                      <div
                        key={property.id}
                        className="rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all overflow-hidden"
                      >
                        {/* Rank header */}
                        <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 bg-gray-50/60 border-b border-gray-100">
                          <span
                            className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm ${
                              index === 0
                                ? "bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand-500/30"
                                : "bg-gray-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="h-1.5 w-full bg-gray-200/70 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600"
                                style={{
                                  width: `${Math.max(
                                    4,
                                    Math.min(100, score)
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="flex-shrink-0 text-xs font-semibold text-brand-600 inline-flex items-center gap-1">
                            <FiZap className="h-3.5 w-3.5" />
                            {score}% match
                            {index === 0 && (
                              <span className="ml-1 hidden sm:inline rounded-full bg-brand-600 text-white px-2 py-0.5 text-[10px] font-semibold">
                                Best match
                              </span>
                            )}
                          </span>
                        </div>

                        <PropertyListView
                          property={property}
                          priority={index < 2}
                        />

                        {rank?.reason && (
                          <div className="flex items-start gap-2.5 px-4 sm:px-5 py-3.5 border-t border-brand-100/70 bg-brand-50/40">
                            <FiCpu className="h-4 w-4 text-brand-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[13px] text-gray-600 leading-relaxed">
                              {rank.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-14 bg-white rounded-2xl border border-gray-100 shadow-sm px-6">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50 text-gray-300 mb-3">
                    <FiSearch className="h-6 w-6" />
                  </span>
                  <h3 className="text-sm font-semibold text-gray-800">
                    No strong matches found
                  </h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                    Try a follow-up above — broaden location, price, or property
                    type.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function hasCriteria(criteria: AiCriteria): boolean {
  return Boolean(
    criteria.listingType ||
      criteria.location ||
      criteria.minPrice ||
      criteria.maxPrice ||
      criteria.bedrooms !== undefined ||
      criteria.category ||
      (criteria.features && criteria.features.length > 0)
  );
}

function Chip({
  icon,
  label,
}: {
  icon?: React.ReactNode;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-gray-700 capitalize">
      {icon && <span className="text-brand-500">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-3.5 py-3">
      <p className="text-[11px] text-gray-500 uppercase tracking-wide flex items-center gap-1">
        <span className="text-brand-500">{icon}</span>
        {label}
      </p>
      <p
        className="text-sm font-semibold text-gray-900 mt-1 truncate"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function InsightCard({
  icon,
  title,
  body,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "amber" | "emerald" | "blue";
}) {
  const tones = {
    amber: {
      card: "border-amber-100 bg-gradient-to-br from-amber-50/80 to-white",
      icon: "bg-amber-100 text-amber-600",
    },
    emerald: {
      card: "border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white",
      icon: "bg-emerald-100 text-emerald-600",
    },
    blue: {
      card: "border-blue-100 bg-gradient-to-br from-blue-50/80 to-white",
      icon: "bg-blue-100 text-blue-600",
    },
  };
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${tones[tone].card}`}>
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className={`p-2 rounded-lg ${tones[tone].icon}`}>{icon}</span>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{body}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
      <div className="flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="h-7 w-7 rounded-full bg-gray-200" />
        <div className="flex-1 h-1.5 rounded-full bg-gray-100" />
        <div className="h-4 w-24 rounded-full bg-gray-200" />
      </div>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-[340px] lg:w-[400px] h-[190px] sm:h-[220px] md:h-[250px] bg-gray-100" />
        <div className="flex-1 p-5 space-y-3">
          <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
          <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
          <div className="flex gap-2 pt-1">
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
            <div className="h-8 w-24 bg-gray-100 rounded-lg" />
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full" />
          <div className="h-3 w-5/6 bg-gray-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function priceLabel(min?: number, max?: number): string {
  if (min && max) return `${formatPrice(min)} – ${formatPrice(max)}`;
  if (max) return `under ${formatPrice(max)}`;
  if (min) return `from ${formatPrice(min)}`;
  return "";
}

function compactKes(value: number): string {
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `KES ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `KES ${Math.round(value / 1_000)}K`;
  }
  return formatPrice(value);
}
