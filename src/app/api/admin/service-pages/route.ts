import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

interface ServicePageRow {
  id: string;
  configKey: string;
  slug: string;
  previousSlugs: string | null;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  ogTitle: string | null;
  ogDescription: string | null;
  canonicalUrl: string | null;
  isActive: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// GET /api/admin/service-pages — list all service pages
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await query<ServicePageRow>(
      "SELECT * FROM service_pages ORDER BY sortOrder ASC, createdAt ASC"
    );

    const servicePages = rows.map((row) => ({
      ...row,
      previousSlugs: row.previousSlugs ? JSON.parse(row.previousSlugs) : [],
      isActive: Boolean(row.isActive),
    }));

    return NextResponse.json({ servicePages });
  } catch (error) {
    console.error("Failed to fetch service pages:", error);
    return NextResponse.json(
      { error: "Failed to fetch service pages" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/service-pages — update a service page
export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Service page ID is required" }, { status: 400 });
    }

    // Fetch current record to track slug changes
    const existing = await query<ServicePageRow>(
      "SELECT * FROM service_pages WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json({ error: "Service page not found" }, { status: 404 });
    }

    const current = existing[0];
    const setClauses: string[] = [];
    const params: (string | number | null)[] = [];

    // Handle slug change — track previous slugs for 301 redirects
    if (updates.slug && updates.slug !== current.slug) {
      const newSlug = updates.slug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check slug uniqueness
      const slugExists = await query<ServicePageRow>(
        "SELECT id FROM service_pages WHERE slug = ? AND id != ?",
        [newSlug, id]
      );
      if (slugExists.length > 0) {
        return NextResponse.json(
          { error: `Slug "${newSlug}" is already in use by another service page` },
          { status: 409 }
        );
      }

      // Add current slug to previousSlugs
      const previousSlugs: string[] = current.previousSlugs
        ? JSON.parse(current.previousSlugs)
        : [];
      if (!previousSlugs.includes(current.slug)) {
        previousSlugs.push(current.slug);
      }

      setClauses.push("slug = ?");
      params.push(newSlug);
      setClauses.push("previousSlugs = ?");
      params.push(JSON.stringify(previousSlugs));
    }

    // Handle other text fields
    const textFields = [
      "title", "shortTitle", "metaTitle", "metaDescription",
      "ogTitle", "ogDescription", "canonicalUrl", "configKey",
    ] as const;

    for (const field of textFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        params.push(updates[field] || null);
      }
    }

    // Handle boolean/number fields
    if (updates.isActive !== undefined) {
      setClauses.push("isActive = ?");
      params.push(updates.isActive ? 1 : 0);
    }

    if (updates.sortOrder !== undefined) {
      setClauses.push("sortOrder = ?");
      params.push(Number(updates.sortOrder));
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    params.push(id);
    await query(
      `UPDATE service_pages SET ${setClauses.join(", ")} WHERE id = ?`,
      params
    );

    // Fetch and return updated record
    const updated = await query<ServicePageRow>(
      "SELECT * FROM service_pages WHERE id = ?",
      [id]
    );

    const result = {
      ...updated[0],
      previousSlugs: updated[0].previousSlugs
        ? JSON.parse(updated[0].previousSlugs)
        : [],
      isActive: Boolean(updated[0].isActive),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to update service page:", error);
    return NextResponse.json(
      { error: "Failed to update service page" },
      { status: 500 }
    );
  }
}

// POST /api/admin/service-pages — create a new service page
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      configKey,
      slug: rawSlug,
      title,
      shortTitle,
      metaTitle,
      metaDescription,
      ogTitle,
      ogDescription,
      canonicalUrl,
      sortOrder,
    } = body;

    if (!configKey || !rawSlug || !title || !metaTitle || !metaDescription) {
      return NextResponse.json(
        { error: "configKey, slug, title, metaTitle, and metaDescription are required" },
        { status: 400 }
      );
    }

    const slug = rawSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Check uniqueness for both configKey and slug
    const exists = await query<ServicePageRow>(
      "SELECT id FROM service_pages WHERE configKey = ? OR slug = ?",
      [configKey, slug]
    );
    if (exists.length > 0) {
      return NextResponse.json(
        { error: "A service page with this configKey or slug already exists" },
        { status: 409 }
      );
    }

    const id = `sp-${uuidv4().slice(0, 8)}`;
    await query(
      `INSERT INTO service_pages (id, configKey, slug, title, shortTitle, metaTitle, metaDescription, ogTitle, ogDescription, canonicalUrl, isActive, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
      [
        id,
        configKey,
        slug,
        title,
        shortTitle || title,
        metaTitle,
        metaDescription,
        ogTitle || null,
        ogDescription || null,
        canonicalUrl || null,
        sortOrder || 0,
      ]
    );

    const created = await query<ServicePageRow>(
      "SELECT * FROM service_pages WHERE id = ?",
      [id]
    );

    return NextResponse.json(
      {
        ...created[0],
        previousSlugs: [],
        isActive: Boolean(created[0].isActive),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create service page:", error);
    return NextResponse.json(
      { error: "Failed to create service page" },
      { status: 500 }
    );
  }
}
