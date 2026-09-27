import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { classifyUrl, type EntityType } from "@/lib/seo/routes";
import { resolvePageMeta } from "@/lib/seo/overrides";

/**
 * GET /api/admin/seo/agent/tasks
 * List optimization tasks with filtering.
 *
 * Query params: status, severity, issueType, pageType, limit, offset
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const severity = searchParams.get("severity");
    const issueType = searchParams.get("issueType");
    const pageType = searchParams.get("pageType");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (status && status !== "all") {
      conditions.push("status = ?");
      params.push(status);
    }
    if (severity) {
      conditions.push("severity = ?");
      params.push(severity);
    }
    if (issueType) {
      conditions.push("issueType = ?");
      params.push(issueType);
    }
    if (pageType) {
      conditions.push("pageType = ?");
      params.push(pageType);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const tasks = await query(
      `SELECT * FROM seo_optimization_task ${whereClause}
       ORDER BY
         CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END,
         createdAt DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [{ count }] = await query<{ count: number }>(
      `SELECT COUNT(*) as count FROM seo_optimization_task ${whereClause}`,
      params
    );

    return NextResponse.json({
      success: true,
      tasks,
      pagination: { total: count, limit, offset, hasMore: offset + limit < count },
    });
  } catch (error) {
    console.error("[SEO Agent] Tasks fetch failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Matches the shape agents actually write into seo_optimization_task.proposedValue
// (see LLMOptimizationResult in agents/on-page-optimization.ts).
const ProposedValueSchema = z
  .object({
    optimizedTitle: z.string().min(1).max(255).optional(),
    optimizedDescription: z.string().min(1).max(500).optional(),
    optimizedKeywords: z.string().max(500).optional(),
    ogImage: z.string().max(500).optional(),
    noIndex: z.boolean().optional(),
  })
  .refine(
    (v) =>
      v.optimizedTitle !== undefined ||
      v.optimizedDescription !== undefined ||
      v.optimizedKeywords !== undefined ||
      v.ogImage !== undefined ||
      v.noIndex !== undefined,
    { message: "proposedValue must contain at least one applicable field" }
  );

interface TaskRow {
  id: string;
  pageUrl: string;
  proposedValue: string | null;
  status: string;
}

interface EntityExistsRow {
  id: string;
}

/** Verify the entity a task targets still exists before writing an override for it. */
async function entityExists(entityType: EntityType, entityId: string): Promise<boolean> {
  if (!entityId) return true; // static pages have no entity to verify
  switch (entityType) {
    case "property": {
      const rows = await query<EntityExistsRow>("SELECT id FROM property WHERE id = ? LIMIT 1", [entityId]);
      return rows.length > 0;
    }
    case "blog_post": {
      const rows = await query<EntityExistsRow>(
        "SELECT id FROM post WHERE id = ? OR slug = ? LIMIT 1",
        [entityId, entityId]
      );
      return rows.length > 0;
    }
    case "service": {
      const rows = await query<EntityExistsRow>(
        "SELECT id FROM service_pages WHERE slug = ? LIMIT 1",
        [entityId]
      ).catch(() => [] as EntityExistsRow[]);
      return rows.length > 0;
    }
    default:
      return true;
  }
}

/**
 * PATCH /api/admin/seo/agent/tasks
 * Body: { taskId: string, action: "approve" | "reject" | "revert" }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { taskId, action } = body;

    if (!taskId || !action) {
      return NextResponse.json({ error: "taskId and action are required" }, { status: 400 });
    }

    if (action === "approve") {
      const [task] = await query<TaskRow>(
        "SELECT id, pageUrl, proposedValue, status FROM seo_optimization_task WHERE id = ?",
        [taskId]
      );
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      if (task.status === "applied" || task.status === "auto_applied") {
        return NextResponse.json({ error: "Task is already applied" }, { status: 409 });
      }

      let parsed: z.infer<typeof ProposedValueSchema>;
      try {
        const raw = task.proposedValue ? JSON.parse(task.proposedValue) : {};
        parsed = ProposedValueSchema.parse(raw);
      } catch (parseError) {
        return NextResponse.json(
          {
            error: "Task proposedValue is malformed or empty — cannot apply",
            detail: parseError instanceof z.ZodError ? parseError.issues : String(parseError),
          },
          { status: 400 }
        );
      }

      const { entityType, entityId: classifiedId } = classifyUrl(task.pageUrl);
      const entityId = classifiedId ?? "";

      const exists = await entityExists(entityType, entityId);
      if (!exists) {
        return NextResponse.json(
          { error: `Target ${entityType} for ${task.pageUrl} no longer exists — task left pending` },
          { status: 404 }
        );
      }

      // Snapshot current effective values (whatever a visitor would see right now) for rollback.
      const previous = await resolvePageMeta(task.pageUrl, { type: entityType, id: entityId });

      const newTitle = parsed.optimizedTitle ?? null;
      const newDescription = parsed.optimizedDescription ?? null;
      const newKeywords = parsed.optimizedKeywords ?? null;
      const newOgImage = parsed.ogImage ?? null;
      const newNoIndex = parsed.noIndex ?? false;

      const overrideId = `ovr_${randomUUID().replace(/-/g, "").substring(0, 20)}`;
      const writeResult = await query<{ affectedRows: number }>(
        `INSERT INTO seo_page_override
           (id, urlPattern, entityType, entityId, title, description, keywords, ogImage, noIndex, source, taskId, previousValue)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'agent', ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           keywords = VALUES(keywords),
           ogImage = VALUES(ogImage),
           noIndex = VALUES(noIndex),
           source = 'agent',
           taskId = VALUES(taskId),
           previousValue = VALUES(previousValue),
           appliedAt = CURRENT_TIMESTAMP(3),
           revertedAt = NULL`,
        [
          overrideId,
          task.pageUrl,
          entityType,
          entityId,
          newTitle,
          newDescription,
          newKeywords,
          newOgImage,
          newNoIndex ? 1 : 0,
          taskId,
          JSON.stringify(previous || { source: "default" }),
        ]
      );

      // affectedRows is 1 (insert) or 2 (MySQL's upsert-updated convention) — 0 only if the
      // statement never reached the table (shouldn't happen given entityExists check above).
      const affected = (writeResult as unknown as { affectedRows?: number }).affectedRows ?? 1;
      if (affected === 0) {
        return NextResponse.json(
          { error: "Override write affected 0 rows — task left pending" },
          { status: 500 }
        );
      }

      await query(
        `UPDATE seo_optimization_task SET status = 'applied', appliedAt = CURRENT_TIMESTAMP(3) WHERE id = ?`,
        [taskId]
      );
      revalidateTag("seo-meta", { expire: 0 });

      return NextResponse.json({
        success: true,
        message: "Override applied — live within the seo-meta cache TTL",
        affectedRows: affected,
        entityType,
        entityId: entityId || null,
      });
    }

    if (action === "reject") {
      await query(
        `UPDATE seo_optimization_task SET status = 'rejected' WHERE id = ?`,
        [taskId]
      );
      return NextResponse.json({ success: true, message: "Task rejected" });
    }

    if (action === "revert") {
      const [task] = await query<TaskRow>(
        "SELECT id, pageUrl, proposedValue, status FROM seo_optimization_task WHERE id = ?",
        [taskId]
      );
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }

      const { entityType, entityId: classifiedId } = classifyUrl(task.pageUrl);
      const entityId = classifiedId ?? "";

      const result = await query<{ affectedRows: number }>(
        `UPDATE seo_page_override
         SET revertedAt = CURRENT_TIMESTAMP(3)
         WHERE urlPattern = ? AND entityType = ? AND entityId = ? AND taskId = ? AND revertedAt IS NULL`,
        [task.pageUrl, entityType, entityId, taskId]
      );
      const affected = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;
      if (affected === 0) {
        return NextResponse.json(
          { error: "No active override found for this task — nothing to revert" },
          { status: 404 }
        );
      }

      await query(
        `UPDATE seo_optimization_task SET status = 'pending', appliedAt = NULL WHERE id = ?`,
        [taskId]
      );
      revalidateTag("seo-meta", { expire: 0 });

      return NextResponse.json({ success: true, message: "Override reverted", affectedRows: affected });
    }

    return NextResponse.json({ error: "Invalid action. Use 'approve', 'reject', or 'revert'." }, { status: 400 });
  } catch (error) {
    console.error("[SEO Agent] Task update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
