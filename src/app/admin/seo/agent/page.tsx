"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiCpu, FiSearch, FiTarget, FiAlertTriangle, FiTrendingUp,
  FiList, FiCheckCircle, FiXCircle, FiRefreshCw, FiPlay,
  FiChevronRight, FiExternalLink, FiZap, FiEye, FiThumbsUp,
  FiArrowUp, FiArrowDown, FiMinus, FiClock,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import ModelSelector from "./components/ModelSelector";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardStats {
  keywordCount: number;
  trackingKeywordCount: number;
  rankingKeywordCount: number;
  pendingTaskCount: number;
  openIssueCount: number;
  contentGapCount: number;
  lastRunByType: Record<string, { status: string; startedAt: string; summary: string }>;
}

interface AgentRun {
  id: string;
  agentType: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  itemsProcessed: number;
  summary: string | null;
  costUsd: number;
}

interface Keyword {
  id: string;
  keyword: string;
  cluster: string | null;
  intent: string;
  searchVolumeEst: number;
  difficulty: number;
  currentRank: number | null;
  bestRank: number | null;
  status: string;
  priority: number;
  location: string | null;
}

interface OptimizationTask {
  id: string;
  pageUrl: string;
  pageType: string;
  issueType: string;
  severity: string;
  currentValue: string | null;
  proposedValue: string | null;
  llmReasoning: string | null;
  status: string;
  createdAt: string;
}

interface TechnicalIssue {
  id: string;
  issueType: string;
  url: string;
  detail: string | null;
  severity: string;
  status: string;
  lastDetected: string;
}

interface ContentGap {
  id: string;
  gapType: string;
  title: string | null;
  targetKeyword: string | null;
  suggestedUrl: string | null;
  contentBrief: string | null;
  priorityScore: number;
  status: string;
  propertyCount: number;
}

interface RankingEntry {
  id: string;
  keyword: string;
  cluster: string | null;
  currentRank: number | null;
  bestRank: number | null;
  searchVolumeEst: number;
  lastChange: number | null;
}

const AGENT_LABELS: Record<string, string> = {
  keyword_discovery: "Keyword Discovery",
  on_page_optimization: "On-Page Optimization",
  content_strategy: "Content Strategy",
  technical_monitor: "Technical Monitor",
  ranking_tracker: "Ranking Tracker",
};

const AGENT_ICONS: Record<string, React.ElementType> = {
  keyword_discovery: FiSearch,
  on_page_optimization: FiTarget,
  content_strategy: FiZap,
  technical_monitor: FiAlertTriangle,
  ranking_tracker: FiTrendingUp,
};

// ─── Main Component ───────────────────────────────────────────────────────────

type Tab = "dashboard" | "keywords" | "tasks" | "issues" | "gaps" | "rankings";

export default function SeoAgentDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentRuns, setRecentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/seo/agent/status");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
        setRecentRuns(data.recentRuns || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const runAgent = async (agent: string) => {
    setRunning(agent);
    const toastId = toast.loading(`Starting ${AGENT_LABELS[agent] || agent}...`);

    try {
      const response = await fetch("/api/admin/seo/agent/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent }),
      });
      const data = await response.json();

      if (data.success) {
        toast.success(`${AGENT_LABELS[agent] || agent} completed successfully`, { id: toastId });
        await fetchDashboard();
      } else {
        toast.error(data.message || "Agent run failed", { id: toastId });
      }
    } catch (error) {
      toast.error("Failed to run agent", { id: toastId });
      console.error(error);
    } finally {
      setRunning(null);
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: "dashboard", label: "Dashboard", icon: FiCpu },
    { id: "keywords", label: "Keywords", icon: FiSearch, badge: stats?.keywordCount },
    { id: "tasks", label: "Optimization Queue", icon: FiList, badge: stats?.pendingTaskCount },
    { id: "issues", label: "Technical Issues", icon: FiAlertTriangle, badge: stats?.openIssueCount },
    { id: "gaps", label: "Content Gaps", icon: FiZap, badge: stats?.contentGapCount },
    { id: "rankings", label: "Rankings", icon: FiTrendingUp },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FiCpu className="w-7 h-7 text-[#468AD1]" />
            SEO Agent Dashboard
          </h1>
          <p className="text-gray-600">Autonomous SEO optimization powered by AI agents</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDashboard()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FiRefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => runAgent("all")}
            disabled={running !== null}
            className="flex items-center gap-2 px-4 py-2 bg-[#468AD1] text-white rounded-lg hover:bg-[#2F6FAE] disabled:opacity-50"
          >
            {running === "all" ? (
              <FiRefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FiPlay className="w-4 h-4" />
            )}
            Run All Agents
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-[#468AD1] text-[#468AD1]"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge !== undefined && tab.badge! > 0 && (
                <span className="px-2 py-0.5 text-xs bg-[#468AD1] text-white rounded-full">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#468AD1]" />
        </div>
      ) : (
        <>
          {activeTab === "dashboard" && (
            <DashboardTab
              stats={stats}
              recentRuns={recentRuns}
              runAgent={runAgent}
              running={running}
            />
          )}
          {activeTab === "keywords" && <KeywordsTab />}
          {activeTab === "tasks" && <TasksTab />}
          {activeTab === "issues" && <IssuesTab />}
          {activeTab === "gaps" && <GapsTab />}
          {activeTab === "rankings" && <RankingsTab />}
        </>
      )}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({
  stats,
  recentRuns,
  runAgent,
  running,
}: {
  stats: DashboardStats | null;
  recentRuns: AgentRun[];
  runAgent: (agent: string) => void;
  running: string | null;
}) {
  if (!stats) return null;

  const statCards = [
    { label: "Total Keywords", value: stats.keywordCount, icon: FiSearch, color: "blue" },
    { label: "Tracking", value: stats.trackingKeywordCount, icon: FiEye, color: "green" },
    { label: "Ranking in SERP", value: stats.rankingKeywordCount, icon: FiTrendingUp, color: "purple" },
    { label: "Pending Tasks", value: stats.pendingTaskCount, icon: FiList, color: "orange" },
    { label: "Open Issues", value: stats.openIssueCount, icon: FiAlertTriangle, color: "red" },
    { label: "Content Gaps", value: stats.contentGapCount, icon: FiZap, color: "yellow" },
  ];

  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-500",
    green: "bg-green-100 text-green-500",
    purple: "bg-purple-100 text-purple-500",
    orange: "bg-orange-100 text-orange-500",
    red: "bg-red-100 text-red-500",
    yellow: "bg-yellow-100 text-yellow-500",
  };

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-lg shadow-sm p-4">
            <div className={`p-2 rounded-lg w-fit mb-2 ${colorMap[card.color]}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-xs text-gray-600">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Model Selector — searchable OpenRouter model picker */}
      <ModelSelector />

      {/* Agent Controls */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Controls</h3>
        <p className="text-sm text-gray-600 mb-4">
          Run individual agents or the full pipeline. Agents use OpenRouter LLMs to analyze, optimize, and track your SEO.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(AGENT_LABELS).map(([agentType, label]) => {
            const Icon = AGENT_ICONS[agentType];
            const lastRun = stats.lastRunByType[agentType];
            const isRunning = running === agentType;

            return (
              <div key={agentType} className="border border-gray-200 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#468AD1]/10 rounded-lg">
                      <Icon className="w-4 h-4 text-[#468AD1]" />
                    </div>
                    <span className="font-medium text-gray-900 text-sm">{label}</span>
                  </div>
                  {lastRun && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      lastRun.status === "completed" ? "bg-green-100 text-green-700" :
                      lastRun.status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {lastRun.status}
                    </span>
                  )}
                </div>

                {lastRun && (
                  <p className="text-xs text-gray-500 line-clamp-2">{lastRun.summary}</p>
                )}

                <button
                  onClick={() => runAgent(agentType)}
                  disabled={running !== null}
                  className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 text-sm mt-auto"
                >
                  {isRunning ? <FiRefreshCw className="w-3 h-3 animate-spin" /> : <FiPlay className="w-3 h-3" />}
                  {isRunning ? "Running..." : "Run Now"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        {recentRuns.length === 0 ? (
          <p className="text-gray-500 text-sm">No agent runs yet. Click "Run All Agents" to get started.</p>
        ) : (
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div key={run.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  run.status === "completed" ? "bg-green-500" :
                  run.status === "failed" ? "bg-red-500" :
                  run.status === "running" ? "bg-yellow-500 animate-pulse" :
                  "bg-gray-400"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm">
                      {AGENT_LABELS[run.agentType] || run.agentType}
                    </span>
                    {run.itemsProcessed > 0 && (
                      <span className="text-xs text-gray-500">{run.itemsProcessed} items</span>
                    )}
                    {run.costUsd > 0 && (
                      <span className="text-xs text-gray-500">${Number(run.costUsd).toFixed(4)}</span>
                    )}
                  </div>
                  {run.summary && (
                    <p className="text-xs text-gray-600 truncate">{run.summary}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {formatTime(run.startedAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Keywords Tab ─────────────────────────────────────────────────────────────

function KeywordsTab() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("priority");

  const fetchKeywords = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("sortBy", sortBy);

    try {
      const res = await fetch(`/api/admin/seo/agent/keywords?${params}`);
      const data = await res.json();
      if (data.success) setKeywords(data.keywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    const timeout = setTimeout(fetchKeywords, 300);
    return () => clearTimeout(timeout);
  }, [fetchKeywords]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search keywords..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-lg text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="tracking">Tracking</option>
          <option value="ranking">Ranking</option>
          <option value="optimized">Optimized</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value="priority">Sort: Priority</option>
          <option value="volume">Sort: Volume</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="rank">Sort: Rank</option>
          <option value="keyword">Sort: Keyword</option>
        </select>
      </div>

      {/* Keywords Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
          </div>
        ) : keywords.length === 0 ? (
          <div className="text-center py-12">
            <FiSearch className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No keywords found. Run the Keyword Discovery agent first.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Keyword</th>
                  <th className="text-left px-4 py-3 font-medium">Cluster</th>
                  <th className="text-left px-4 py-3 font-medium">Intent</th>
                  <th className="text-right px-4 py-3 font-medium">Volume</th>
                  <th className="text-right px-4 py-3 font-medium">Difficulty</th>
                  <th className="text-center px-4 py-3 font-medium">Rank</th>
                  <th className="text-center px-4 py-3 font-medium">Priority</th>
                  <th className="text-center px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{kw.keyword}</td>
                    <td className="px-4 py-3 text-gray-600">{kw.cluster || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${intentColor(kw.intent)}`}>
                        {kw.intent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{kw.searchVolumeEst || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={difficultyColor(kw.difficulty)}>{kw.difficulty || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {kw.currentRank ? (
                        <span className={`font-medium ${kw.currentRank <= 10 ? "text-green-600" : kw.currentRank <= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          #{kw.currentRank}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#468AD1] rounded-full"
                            style={{ width: `${(kw.priority / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{kw.priority}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${statusColor(kw.status)}`}>
                        {kw.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tasks Tab (Optimization Queue) ───────────────────────────────────────────

function TasksTab() {
  const [tasks, setTasks] = useState<OptimizationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/seo/agent/tasks?status=${statusFilter}`);
      const data = await res.json();
      if (data.success) setTasks(data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleTask = async (taskId: string, action: "approve" | "reject") => {
    try {
      const res = await fetch("/api/admin/seo/agent/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(action === "approve" ? "Task applied to page" : "Task rejected");
        fetchTasks();
      } else {
        toast.error(data.error || "Action failed");
      }
    } catch (error) {
      toast.error("Failed to update task");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "applied", "rejected", "all"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg capitalize ${
              statusFilter === s ? "bg-[#468AD1] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <FiCheckCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No {statusFilter} tasks. Run the On-Page Optimization agent to generate tasks.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${severityColor(task.severity)}`}>
                      {task.severity}
                    </span>
                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {task.issueType.replace(/_/g, " ")}
                    </span>
                    <a
                      href={task.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline flex items-center gap-1 truncate max-w-xs"
                    >
                      {task.pageUrl} <FiExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                  </div>

                  {task.llmReasoning && (
                    <p className="text-sm text-gray-600 mb-2">{task.llmReasoning}</p>
                  )}

                  {task.currentValue && task.proposedValue && (
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div className="bg-red-50 p-2 rounded">
                        <p className="font-medium text-red-700 mb-1">Current</p>
                        <p className="text-gray-700 break-words">{formatValue(task.currentValue)}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded">
                        <p className="font-medium text-green-700 mb-1">Proposed</p>
                        <p className="text-gray-700 break-words">{formatValue(task.proposedValue)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {task.status === "pending" && (
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleTask(task.id, "approve")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                    >
                      <FiCheckCircle className="w-4 h-4" /> Apply
                    </button>
                    <button
                      onClick={() => handleTask(task.id, "reject")}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      <FiXCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Issues Tab ───────────────────────────────────────────────────────────────

function IssuesTab() {
  const [issues, setIssues] = useState<TechnicalIssue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo/agent/issues?status=open");
      const data = await res.json();
      if (data.success) setIssues(data.issues);
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const handleIssue = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/admin/seo/agent/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, type: "issue" }),
      });
      if (res.ok) {
        toast.success("Issue updated");
        fetchIssues();
      }
    } catch (error) {
      toast.error("Failed to update issue");
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <FiCheckCircle className="w-10 h-10 text-green-300 mx-auto mb-2" />
          <p className="text-gray-500">No open issues. Run the Technical Monitor agent to scan for problems.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <div key={issue.id} className="bg-white rounded-lg shadow-sm p-4 flex items-start gap-3">
              <div className={`mt-0.5 p-1 rounded ${severityBg(issue.severity)}`}>
                <FiAlertTriangle className={`w-4 h-4 ${severityText(issue.severity)}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 text-sm">
                    {issue.issueType.replace(/_/g, " ")}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${severityColor(issue.severity)}`}>
                    {issue.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{issue.detail}</p>
                <a
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline mt-1 inline-block"
                >
                  {issue.url}
                </a>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleIssue(issue.id, "resolve")}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  Resolve
                </button>
                <button
                  onClick={() => handleIssue(issue.id, "ignore")}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                >
                  Ignore
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Content Gaps Tab ─────────────────────────────────────────────────────────

function GapsTab() {
  const [gaps, setGaps] = useState<ContentGap[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGaps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo/agent/issues?type=gaps&status=new");
      const data = await res.json();
      if (data.success) setGaps(data.gaps);
    } catch (error) {
      console.error("Error fetching gaps:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGaps();
  }, [fetchGaps]);

  const handleGap = async (id: string, action: string) => {
    try {
      await fetch("/api/admin/seo/agent/issues", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action, type: "gap" }),
      });
      toast.success("Content gap updated");
      fetchGaps();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
        </div>
      ) : gaps.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <FiZap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No content gaps found. Run the Content Strategy agent to discover opportunities.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {gaps.map((gap) => (
            <div key={gap.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {gap.gapType.replace(/_/g, " ")}
                  </span>
                  {gap.propertyCount > 0 && (
                    <span className="ml-2 text-xs text-gray-500">{gap.propertyCount} listings</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#468AD1] rounded-full"
                      style={{ width: `${(gap.priorityScore / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{gap.priorityScore}</span>
                </div>
              </div>

              <h4 className="font-medium text-gray-900 text-sm mb-1">{gap.title}</h4>
              {gap.targetKeyword && (
                <p className="text-xs text-blue-500 mb-2">Target: {gap.targetKeyword}</p>
              )}
              {gap.contentBrief && (
                <p className="text-xs text-gray-600 mb-3 line-clamp-3">{gap.contentBrief}</p>
              )}

              {gap.suggestedUrl && (
                <a
                  href={gap.suggestedUrl}
                  className="text-xs text-blue-500 hover:underline block mb-3"
                >
                  {gap.suggestedUrl}
                </a>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => handleGap(gap.id, "approved")}
                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleGap(gap.id, "rejected")}
                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Rankings Tab ─────────────────────────────────────────────────────────────

function RankingsTab() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [stats, setStats] = useState<{ totalTracked: number; inTop10: number; inTop100: number; avgPosition: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/seo/agent/rankings");
        const data = await res.json();
        if (data.success) {
          setRankings(data.rankings || []);
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Error fetching rankings:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#468AD1]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      {stats && stats.totalTracked > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-2xl font-bold text-gray-900">{stats.totalTracked}</p>
            <p className="text-xs text-gray-600">Keywords Tracked</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-2xl font-bold text-green-600">{stats.inTop10}</p>
            <p className="text-xs text-gray-600">In Top 10</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.inTop100}</p>
            <p className="text-xs text-gray-600">In Top 100</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <p className="text-2xl font-bold text-orange-600">{stats.avgPosition}</p>
            <p className="text-xs text-gray-600">Avg Position</p>
          </div>
        </div>
      )}

      {/* Rankings Table */}
      {rankings.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm text-center py-12">
          <FiTrendingUp className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">No ranking data yet. Run the Ranking Tracker agent after discovering keywords.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Keyword</th>
                  <th className="text-center px-4 py-3 font-medium">Position</th>
                  <th className="text-center px-4 py-3 font-medium">Change</th>
                  <th className="text-center px-4 py-3 font-medium">Best</th>
                  <th className="text-right px-4 py-3 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rankings.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 max-w-xs truncate">{r.keyword}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-medium ${
                        (r.currentRank ?? 0) <= 10 ? "text-green-600" :
                        (r.currentRank ?? 0) <= 50 ? "text-yellow-600" : "text-red-600"
                      }`}>
                        #{r.currentRank || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.lastChange && r.lastChange !== 0 ? (
                        <span className={`flex items-center justify-center gap-1 ${
                          r.lastChange > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {r.lastChange > 0 ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
                          {Math.abs(r.lastChange)}
                        </span>
                      ) : (
                        <FiMinus className="w-3 h-3 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {r.bestRank ? `#${r.bestRank}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{r.searchVolumeEst || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

function formatValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed)
        .map(([k, v]) => `${k}: ${String(v).substring(0, 100)}`)
        .join("\n");
    }
    return parsed;
  } catch {
    return value.substring(0, 200);
  }
}

function intentColor(intent: string): string {
  switch (intent) {
    case "commercial": return "bg-blue-100 text-blue-700";
    case "transactional": return "bg-green-100 text-green-700";
    case "informational": return "bg-purple-100 text-purple-700";
    case "navigational": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function difficultyColor(d: number): string {
  if (d <= 3) return "text-green-600 font-medium";
  if (d <= 6) return "text-yellow-600";
  return "text-red-600";
}

function statusColor(status: string): string {
  switch (status) {
    case "new": return "bg-blue-100 text-blue-700";
    case "tracking": return "bg-purple-100 text-purple-700";
    case "ranking": return "bg-green-100 text-green-700";
    case "optimized": return "bg-teal-100 text-teal-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function severityColor(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-100 text-red-700";
    case "high": return "bg-orange-100 text-orange-700";
    case "medium": return "bg-yellow-100 text-yellow-700";
    case "low": return "bg-gray-100 text-gray-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

function severityBg(severity: string): string {
  switch (severity) {
    case "critical": return "bg-red-50";
    case "high": return "bg-orange-50";
    case "medium": return "bg-yellow-50";
    default: return "bg-gray-50";
  }
}

function severityText(severity: string): string {
  switch (severity) {
    case "critical": return "text-red-500";
    case "high": return "text-orange-500";
    case "medium": return "text-yellow-500";
    default: return "text-gray-500";
  }
}
