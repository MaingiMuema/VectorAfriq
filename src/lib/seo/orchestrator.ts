/**
 * SEO Agent Orchestrator
 * 
 * Central entry point for running individual agents or the full pipeline.
 * Used by the API route /api/admin/seo/agent/run.
 */

import { runKeywordDiscoveryAgent } from "./agents/keyword-discovery";
import { runOnPageOptimizationAgent } from "./agents/on-page-optimization";
import { runContentStrategyAgent } from "./agents/content-strategy";
import { runTechnicalMonitorAgent } from "./agents/technical-monitor";
import { runRankingTrackerAgent } from "./agents/ranking-tracker";
import type { AgentType } from "./types";

export interface AgentRunResult {
  runId: string;
  agentType: AgentType;
  success: boolean;
  message: string;
}

/**
 * Run a specific agent or all agents in sequence.
 */
export async function runAgent(
  agentType: AgentType,
  triggerManually = false
): Promise<AgentRunResult[]> {
  if (agentType === "all") {
    return runAllAgents(triggerManually);
  }

  const result = await runSingleAgent(agentType, triggerManually);
  return [result];
}

/**
 * Run a single agent by type.
 */
export async function runSingleAgent(
  agentType: AgentType,
  triggerManually = false
): Promise<AgentRunResult> {
  try {
    let runId: string;

    switch (agentType) {
      case "keyword_discovery":
        runId = await runKeywordDiscoveryAgent(triggerManually);
        break;
      case "on_page_optimization":
        runId = await runOnPageOptimizationAgent(triggerManually);
        break;
      case "content_strategy":
        runId = await runContentStrategyAgent(triggerManually);
        break;
      case "technical_monitor":
        runId = await runTechnicalMonitorAgent(triggerManually);
        break;
      case "ranking_tracker":
        runId = await runRankingTrackerAgent(triggerManually);
        break;
      default:
        return {
          runId: "",
          agentType,
          success: false,
          message: `Unknown agent type: ${agentType}`,
        };
    }

    return {
      runId,
      agentType,
      success: true,
      message: `Agent ${agentType} completed successfully`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SEO Orchestrator] Agent ${agentType} failed:`, message);
    return {
      runId: "",
      agentType,
      success: false,
      message: `Agent ${agentType} failed: ${message}`,
    };
  }
}

/**
 * Run all agents in the recommended pipeline order.
 * Keyword Discovery → On-Page Optimization → Content Strategy → Technical Monitor → Ranking Tracker
 */
export async function runAllAgents(triggerManually = false): Promise<AgentRunResult[]> {
  const results: AgentRunResult[] = [];
  const pipeline: AgentType[] = [
    "keyword_discovery",
    "on_page_optimization",
    "content_strategy",
    "technical_monitor",
    "ranking_tracker",
  ];

  for (const agentType of pipeline) {
    console.log(`[SEO Orchestrator] Running ${agentType}...`);
    const result = await runSingleAgent(agentType, triggerManually);
    results.push(result);

    // Continue even if one agent fails
    if (!result.success) {
      console.warn(`[SEO Orchestrator] ${agentType} failed, continuing pipeline...`);
    }
  }

  return results;
}
