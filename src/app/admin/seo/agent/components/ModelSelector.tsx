"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCpu,
  FiSearch,
  FiCheck,
  FiRefreshCw,
  FiChevronDown,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

interface ModelOption {
  id: string;
  label: string;
  description: string;
  inputCostPer1M: number;
  outputCostPer1M: number;
  isFree: boolean;
  contextLength: number | null;
}

function formatCost(costPer1M: number): string {
  if (costPer1M === 0) return "free";
  const rounded = Math.round(costPer1M * 1_000_000) / 1_000_000;
  return `$${rounded.toLocaleString("en-US", { maximumFractionDigits: 6 })}`;
}

function formatContext(contextLength: number | null): string | null {
  if (!contextLength || contextLength <= 0) return null;
  if (contextLength >= 1_000_000) {
    return `${Math.round(contextLength / 1_000_000)}M ctx`;
  }
  if (contextLength >= 1_000) {
    return `${Math.round(contextLength / 1_000)}K ctx`;
  }
  return `${contextLength} ctx`;
}

export default function ModelSelector() {
  const [activeModelId, setActiveModelId] = useState<string | null>(null);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

  const loadModels = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/seo/agent/model${refresh ? "?refresh=1" : ""}`
      );
      const data = await res.json();
      if (data.success) {
        setActiveModelId(data.activeModelId);
        setModels(data.availableModels || []);
        if (!data.availableModels?.length) {
          setError("OpenRouter returned no models.");
        }
      } else {
        setError(data.error || "Failed to load model config");
      }
    } catch (err) {
      console.error("Failed to fetch model config:", err);
      setError("Failed to load models. Check the server logs.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) =>
      `${m.id} ${m.label} ${m.description}`.toLowerCase().includes(q)
    );
  }, [models, search]);

  const activeModel = useMemo(
    () => models.find((m) => m.id === activeModelId) || null,
    [models, activeModelId]
  );
  const selectedModel = useMemo(
    () => models.find((m) => m.id === selectedId) || null,
    [models, selectedId]
  );
  const isActiveSelected = selectedId !== null && selectedId === activeModelId;
  const freeCount = useMemo(
    () => models.filter((m) => m.isFree).length,
    [models]
  );

  const applyModel = async () => {
    if (!selectedId || isActiveSelected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/seo/agent/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: selectedId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveModelId(selectedId);
        toast.success(`Switched to ${data.activeModel?.label || selectedId}`);
      } else {
        toast.error(data.error || "Failed to switch model");
      }
    } catch {
      toast.error("Failed to switch model");
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlighted((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      else setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && filtered.length > 0) {
        e.preventDefault();
        const target = filtered[Math.min(highlighted, filtered.length - 1)];
        if (target) {
          setSelectedId(target.id);
          setSearch("");
          setOpen(false);
        }
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FiCpu className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">LLM Model</h3>
            <p className="text-sm text-gray-500">
              Pick any model from the OpenRouter catalog — it powers all SEO agents
            </p>
          </div>
        </div>
        <button
          onClick={() => loadModels(true)}
          disabled={loading || refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          title="Re-fetch the latest model list from OpenRouter"
        >
          <FiRefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Currently active model */}
      {activeModel && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-100 rounded-lg">
          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0" />
          <p className="text-sm text-gray-700 min-w-0">
            <span className="font-medium">Active:</span>{" "}
            <span className="font-medium text-gray-900">{activeModel.label}</span>{" "}
            <span className="text-gray-400 font-mono text-xs">{activeModel.id}</span>
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-4 flex items-start gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">
          <FiAlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Searchable combobox */}
      <div ref={rootRef} className="relative">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setHighlighted(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Search models — e.g. gpt, claude, gemini, deepseek…"
            aria-label="Search OpenRouter models"
            aria-expanded={open}
            aria-controls="model-listbox"
            aria-activedescendant={
              open && filtered.length > 0
                ? `model-option-${Math.min(highlighted, filtered.length - 1)}`
                : undefined
            }
            role="combobox"
            className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 focus:border-[#468AD1] text-sm text-gray-900 placeholder-gray-400"
          />
          {search ? (
            <button
              onClick={() => {
                setSearch("");
                setHighlighted(0);
                setOpen(true);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <FiX className="w-4 h-4" />
            </button>
          ) : (
            <FiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>

        {open && (
          <div
            id="model-listbox"
            role="listbox"
            aria-label="OpenRouter models"
            className="absolute z-50 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No models match “{search}”
              </div>
            ) : (
              filtered.map((model, index) => {
                const isActive = model.id === activeModelId;
                const isSelected = model.id === selectedId;
                const ctx = formatContext(model.contextLength);
                return (
                  <button
                    key={model.id}
                    id={`model-option-${index}`}
                    role="option"
                    aria-selected={isSelected || index === highlighted}
                    onClick={() => {
                      setSelectedId(model.id);
                      setSearch("");
                      setOpen(false);
                      setHighlighted(0);
                    }}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`w-full px-4 py-3 text-left flex items-start gap-3 transition-colors ${
                      index === highlighted ? "bg-gray-50" : "bg-white"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm truncate">
                          {model.label}
                        </span>
                        {isActive && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                            Active
                          </span>
                        )}
                        {model.isFree && (
                          <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded-full">
                            Free
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono truncate mt-0.5">
                        {model.id}
                      </p>
                      {!model.isFree && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatCost(model.inputCostPer1M)}/1M in ·{" "}
                          {formatCost(model.outputCostPer1M)}/1M out
                          {ctx ? ` · ${ctx}` : ""}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <FiCheck className="w-4 h-4 text-[#468AD1] flex-shrink-0 mt-0.5" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Selected model panel */}
      {selectedModel && (
        <div className="mt-4 rounded-xl border border-[#468AD1]/30 bg-[#468AD1]/[0.03] p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-gray-900">{selectedModel.label}</p>
                {selectedModel.isFree && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 rounded-full">
                    Free
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedModel.id}</p>
              {selectedModel.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">
                  {selectedModel.description}
                </p>
              )}
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                {!selectedModel.isFree && (
                  <span>
                    {formatCost(selectedModel.inputCostPer1M)}/1M in ·{" "}
                    {formatCost(selectedModel.outputCostPer1M)}/1M out
                  </span>
                )}
                {formatContext(selectedModel.contextLength) && (
                  <span>{formatContext(selectedModel.contextLength)}</span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0">
              {isActiveSelected ? (
                <span className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg">
                  Currently active
                </span>
              ) : (
                <button
                  onClick={applyModel}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50 transition-colors"
                >
                  {saving ? "Applying…" : "Apply model"}
                </button>
              )}
            </div>
          </div>
          {isActiveSelected && (
            <p className="text-xs text-gray-400 mt-2">
              This model is already powering all SEO agents.
            </p>
          )}
        </div>
      )}

      {models.length > 0 && (
        <p className="mt-3 text-xs text-gray-400">
          {models.length.toLocaleString()} models available from OpenRouter
          {freeCount > 0 && ` · ${freeCount.toLocaleString()} free`}
        </p>
      )}
    </div>
  );
}
