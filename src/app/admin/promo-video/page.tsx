"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";
import {
  FiCpu,
  FiDownload,
  FiFilm,
  FiPlay,
  FiRefreshCw,
  FiTrash2,
  FiUpload,
  FiX,
  FiZap,
  FiLoader,
  FiChevronDown,
  FiEye,
} from "react-icons/fi";

interface PromoModel {
  id: string;
  label: string;
  description: string;
  badge: "Flagship" | "Fast";
}

interface ResolvedAsset {
  source: string;
  usedFor: string;
  file: string;
  url?: string;
}

interface JobScene {
  type: string;
  narration?: string;
  kicker?: string;
  headline?: string;
  subline?: string;
  items?: Array<{ title?: string; price?: string }>;
}

interface PromoVideoJob {
  id: string;
  prompt: string;
  model: string;
  format: "landscape" | "vertical" | "both";
  status: "queued" | "claimed" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  step: string | null;
  script: {
    brand?: { name?: string };
    design?: { name?: string; description?: string };
    scenes?: JobScene[];
  } | null;
  assets: ResolvedAsset[] | null;
  videoFile: string | null;
  videoFileVertical: string | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
  createdBy: string | null;
}

interface UploadedAsset {
  path: string;
  serviceUrl: string;
  filename: string;
}

const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  upload: { label: "Admin upload", className: "bg-violet-100 text-violet-700" },
  pexels: { label: "Pexels", className: "bg-emerald-100 text-emerald-700" },
  unsplash: { label: "Unsplash", className: "bg-sky-100 text-sky-700" },
  platform: { label: "Platform photo", className: "bg-amber-100 text-amber-700" },
  ai: { label: "AI generated", className: "bg-fuchsia-100 text-fuchsia-700" },
  fallback: { label: "Fallback", className: "bg-gray-100 text-gray-600" },
};

const STATUS_STYLES: Record<PromoVideoJob["status"], string> = {
  queued: "bg-gray-100 text-gray-700",
  claimed: "bg-indigo-100 text-indigo-700",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  cancelled: "bg-gray-200 text-gray-500",
};

const FORMAT_LABELS: Record<PromoVideoJob["format"], string> = {
  landscape: "Landscape 16:9",
  vertical: "Vertical 9:16",
  both: "Both formats",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

/** Rough elapsed time for an active job (minutes), e.g. for the stuck hint. */
function elapsedMinutes(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60_000);
}

export default function PromoVideoStudioPage() {
  const [prompt, setPrompt] = useState("");
  const [modelId, setModelId] = useState<string | null>(null);
  const [models, setModels] = useState<PromoModel[]>([]);
  const [format, setFormat] = useState<"landscape" | "vertical" | "both">("landscape");
  const [assets, setAssets] = useState<UploadedAsset[]>([]);
  const [jobs, setJobs] = useState<PromoVideoJob[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);

  // ── load model config ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/admin/promo-video/model")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setModels(data.models || []);
          setModelId(data.activeModelId || data.models?.[0]?.id || null);
        }
      })
      .catch(() => toast.error("Failed to load model config"));
  }, []);

  // ── load + poll jobs ──────────────────────────────────────────────────────
  const refreshJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promo-video?limit=20");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) setJobs(data.jobs || []);
    } catch {
      // transient — poll again next tick
    } finally {
      setLoading(false);
    }
  }, []);

  // Keep the latest jobs list in a ref so the polling interval (created once,
  // on mount) can check it without re-running its effect on every fetch. The
  // effect must NOT depend on `jobs` — that would re-trigger refreshJobs()
  // every time setJobs() updates the state, causing an endless request loop.
  const jobsRef = useRef<PromoVideoJob[]>([]);
  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    refreshJobs();
    const timer = setInterval(() => {
      const hasActive = jobsRef.current.some((j) =>
        ["queued", "claimed", "running"].includes(j.status)
      );
      if (hasActive) refreshJobs();
    }, 2500);
    return () => clearInterval(timer);
  }, [refreshJobs]);

  // ── persist model selection ───────────────────────────────────────────────
  const switchModel = async (id: string) => {
    setModelId(id);
    try {
      await fetch("/api/admin/promo-video/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId: id }),
      });
      toast.success("Model preference saved");
    } catch {
      toast.error("Failed to save model preference");
    }
  };

  // ── asset upload ──────────────────────────────────────────────────────────
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const uploading = toast.loading(
      `Uploading ${acceptedFiles.length} asset${acceptedFiles.length > 1 ? "s" : ""}…`
    );
    const uploaded: UploadedAsset[] = [];
    let failed = 0;
    for (const file of acceptedFiles.slice(0, 10)) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/admin/promo-video/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          uploaded.push(data as UploadedAsset);
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    toast.dismiss(uploading);
    if (uploaded.length > 0) {
      setAssets((prev) => [...prev, ...uploaded]);
      toast.success(`Uploaded ${uploaded.length} asset${uploaded.length > 1 ? "s" : ""}`);
    }
    if (failed > 0) toast.error(`${failed} upload${failed > 1 ? "s" : ""} failed`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: 15 * 1024 * 1024,
    multiple: true,
  });

  const removeAsset = (path: string) =>
    setAssets((prev) => prev.filter((a) => a.path !== path));

  // ── generate ──────────────────────────────────────────────────────────────
  const generate = async () => {
    const trimmed = prompt.trim();
    if (trimmed.length < 10) {
      toast.error("Describe what you want the video to promote (min 10 chars)");
      return;
    }
    setCreating(true);
    const toastId = toast.loading("Enqueuing video generation…");
    try {
      const res = await fetch("/api/admin/promo-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: trimmed,
          model: modelId,
          format,
          assets: assets.map((a) => a.serviceUrl),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create job");
      toast.success("Video generation started — it will appear below");
      setPrompt("");
      setAssets([]);
      refreshJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      toast.dismiss(toastId);
      setCreating(false);
    }
  };

  const cancelJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/promo-video/${id}/cancel`, { method: "POST" });
      if (res.ok) {
        toast.success("Job cancelled");
        refreshJobs();
      } else {
        toast.error("Could not cancel job");
      }
    } catch {
      toast.error("Could not cancel job");
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job and its rendered videos? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/promo-video/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Job deleted");
        refreshJobs();
      } else {
        toast.error("Could not delete job");
      }
    } catch {
      toast.error("Could not delete job");
    }
  };

  const activeCount = jobs.filter((j) =>
    ["queued", "claimed", "running"].includes(j.status)
  ).length;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#468AD1]/10 text-[#468AD1] flex items-center justify-center">
              <FiFilm className="w-5 h-5" />
            </span>
            Promo Video Studio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe a promo in plain English — an AI writes the script, sources the
            imagery, generates the voice-over and renders a downloadable video.
          </p>
        </div>
        {activeCount > 0 && (
          <button
            onClick={refreshJobs}
            className="inline-flex items-center gap-2 text-sm text-[#468AD1] font-medium hover:underline"
          >
            <FiRefreshCw className="w-4 h-4" /> {activeCount} job{activeCount > 1 ? "s" : ""} running
          </button>
        )}
      </div>

      {/* ── Generator ──────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">New video</h2>
          <span className="text-xs text-gray-400">{prompt.trim().length}/4000</span>
        </div>
        <div className="p-6 space-y-6">
          {/* prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What should the video promote?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 4000))}
              rows={4}
              placeholder={`e.g. "A summer campaign for apartments in Kilimani and Westlands — highlight fast search, verified listings and AI matchmaking. Warm, premium, aspirational tone."`}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:border-[#468AD1] focus:outline-none focus:ring-2 focus:ring-[#468AD1]/20 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1.5">
              Mention the audience, areas, features or services you want highlighted.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* model */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI model
              </label>
              <div className="grid grid-cols-1 gap-2">
                {models.map((m) => {
                  const active = m.id === modelId;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => switchModel(m.id)}
                      className={`text-left rounded-xl border-2 px-4 py-3 transition-all ${
                        active
                          ? "border-[#468AD1] bg-[#468AD1]/5 shadow-sm"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                          {m.badge === "Flagship" ? (
                            <FiCpu className="w-4 h-4 text-[#468AD1]" />
                          ) : (
                            <FiZap className="w-4 h-4 text-amber-500" />
                          )}
                          {m.label}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            m.badge === "Flagship"
                              ? "bg-[#468AD1]/10 text-[#468AD1]"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{m.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output format
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "landscape", label: "Landscape", hint: "16:9" },
                    { id: "vertical", label: "Vertical", hint: "9:16" },
                    { id: "both", label: "Both", hint: "2 files" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id)}
                    className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                      format === f.id
                        ? "border-[#468AD1] bg-[#468AD1]/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm text-gray-900">{f.label}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{f.hint}</div>
                  </button>
                ))}
              </div>

              {/* uploaded assets */}
              <label className="block text-sm font-medium text-gray-700 mt-6 mb-2">
                Your own assets <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? "border-[#468AD1] bg-[#468AD1]/5"
                    : "border-gray-300 hover:border-[#468AD1]/60"
                }`}
              >
                <input {...getInputProps()} />
                <FiUpload className="mx-auto w-6 h-6 text-gray-400" />
                <p className="text-xs text-gray-500 mt-2">
                  Drag & drop images here, or click to browse
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  JPEG / PNG / WebP · max 15MB each · these take priority over auto-found assets
                </p>
              </div>
              {assets.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {assets.map((a) => (
                    <div
                      key={a.path}
                      className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.path}
                        alt={a.filename}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeAsset(a.path)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <FiX className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* generate */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400 max-w-md">
              Generation typically takes 2–6 minutes (script → assets → voice-over → render).
            </p>
            <button
              onClick={generate}
              disabled={creating || prompt.trim().length < 10}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#468AD1] text-white font-semibold text-sm shadow-sm hover:bg-[#2F6FAE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {creating ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiPlay className="w-4 h-4" />
              )}
              {creating ? "Starting…" : "Generate video"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Jobs ───────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-3">Generated videos</h2>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-sm text-gray-400">
            Loading…
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <FiFilm className="mx-auto w-10 h-10 text-gray-300" />
            <p className="text-sm text-gray-500 mt-3">No videos yet — write a brief and hit “Generate video”.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const isActive = ["queued", "claimed", "running"].includes(job.status);
              const showLandscape = job.status === "completed" && job.videoFile;
              const showVertical = job.status === "completed" && job.videoFileVertical;
              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[job.status]}`}
                      >
                        {isActive && <FiLoader className="w-3 h-3 animate-spin" />}
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {job.model.split("/")[1] || job.model}
                      </span>
                      {job.script?.design?.name && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                          <FiCpu className="w-3 h-3" />
                          {job.script.design.name}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">{FORMAT_LABELS[job.format]}</span>
                      <span className="text-xs text-gray-400">· {timeAgo(job.createdAt)}</span>
                      {job.createdBy && (
                        <span className="text-xs text-gray-400">· {job.createdBy}</span>
                      )}
                      <div className="flex-1" />
                      {isActive && (
                        <button
                          onClick={() => cancelJob(job.id)}
                          className="text-xs text-gray-500 hover:text-red-600 font-medium"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => deleteJob(job.id)}
                        className="text-xs text-gray-400 hover:text-red-600"
                        title="Delete job"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{job.prompt}</p>

                    {/* progress */}
                    {isActive && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                          <span className="flex items-center gap-1.5">
                            <FiLoader className="w-3 h-3 animate-spin text-[#468AD1]" />
                            {job.step || "Preparing…"}
                          </span>
                          <span className="font-semibold">{job.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#468AD1] to-amber-400 transition-all duration-700"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-gray-400">
                            Started {elapsedMinutes(job.createdAt)}m ago
                          </span>
                          {elapsedMinutes(job.createdAt) > 15 && (
                            <span className="text-[11px] font-medium text-amber-600">
                              This is taking unusually long — it may be stuck. You can cancel it.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {job.status === "failed" && job.errorMessage && (
                      <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                        {job.errorMessage}
                      </div>
                    )}

                    {/* actions */}
                    {(showLandscape || showVertical) && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {showLandscape && (
                          <>
                            <a
                              href={`/api/admin/promo-video/${job.id}/download?format=landscape&inline=1`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 transition-colors"
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FiEye className="w-4 h-4" /> Preview
                            </a>
                            <a
                              href={`/api/admin/promo-video/${job.id}/download?format=landscape`}
                              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#468AD1] text-white text-xs font-semibold hover:bg-[#2F6FAE] transition-colors"
                            >
                              <FiDownload className="w-4 h-4" /> Download landscape
                            </a>
                          </>
                        )}
                        {showVertical && (
                          <a
                            href={`/api/admin/promo-video/${job.id}/download?format=vertical`}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-gray-600 transition-colors"
                          >
                            <FiDownload className="w-4 h-4" /> Download vertical
                          </a>
                        )}
                      </div>
                    )}

                    {/* expandable detail */}
                    <button
                      onClick={() =>
                        setExpandedJob(expandedJob === job.id ? null : job.id)
                      }
                      className="mt-4 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <FiChevronDown
                        className={`w-4 h-4 transition-transform ${
                          expandedJob === job.id ? "rotate-180" : ""
                        }`}
                      />
                      {expandedJob === job.id ? "Hide" : "Show"} script & assets
                    </button>
                  </div>

                  {expandedJob === job.id && (
                    <div className="border-t border-gray-100 bg-gray-50/60 px-5 py-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Script
                          </h4>
                          {job.script?.design?.description && (
                            <p className="text-xs text-gray-500 italic mb-3 bg-violet-50/60 border border-violet-100 rounded-lg px-3 py-2">
                              🎨 {job.script.design.description}
                            </p>
                          )}
                          {job.script?.scenes?.length ? (
                            <ol className="space-y-2">
                              {job.script.scenes.map((scene, i) => (
                                <li key={i} className="text-xs text-gray-600 flex gap-2">
                                  <span className="font-mono text-gray-400 shrink-0">
                                    {i + 1}.
                                  </span>
                                  <span>
                                    <span className="font-semibold text-gray-700 capitalize">
                                      {scene.type}
                                    </span>
                                    {scene.narration && (
                                      <span className="text-gray-500"> — “{scene.narration}”</span>
                                    )}
                                    {scene.items && scene.items.length > 0 && (
                                      <span className="block text-gray-400 mt-0.5">
                                        {scene.items
                                          .map((it) => it.title)
                                          .filter(Boolean)
                                          .join(" · ")}
                                      </span>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-xs text-gray-400">No script yet.</p>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Image assets
                          </h4>
                          {job.assets?.length ? (
                            <ul className="space-y-1.5">
                              {job.assets.map((a, i) => (
                                <li
                                  key={i}
                                  className="text-xs text-gray-600 flex items-center gap-2"
                                >
                                  <span className="font-mono text-gray-400">{a.usedFor}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                      SOURCE_LABELS[a.source]?.className ||
                                      "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {SOURCE_LABELS[a.source]?.label || a.source}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-400">No assets yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
