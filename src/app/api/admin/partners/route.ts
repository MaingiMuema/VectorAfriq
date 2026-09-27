import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

interface Partner {
  id: string;
  name: string;
  logo: string;
  link: string;
  createdAt: Date;
  updatedAt: Date;
}

function normalizePartnerLink(link: string): string {
  if (!link) return link;
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (name LIKE ? OR link LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM partner 
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get partners
    const partners = await query<Partner>(
      `
      SELECT * FROM partner
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    const normalizedPartners = partners.map((p) => ({
      ...p,
      link: normalizePartnerLink(p.link),
    }));

    return NextResponse.json({
      partners: normalizedPartners,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching partners:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, logo, link } = body;

    if (!name || !logo || !link) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Normalize the link to ensure it has a protocol
    const normalizedLink = normalizePartnerLink(link);

    // Create partner
    await query(
      `
      INSERT INTO partner (
        id, name, logo, link, createdAt, updatedAt
      ) VALUES (UUID(), ?, ?, ?, NOW(), NOW())
    `,
      [name, logo, normalizedLink] as DatabaseValue[]
    );

    const [partner] = await query<Partner>(
      "SELECT * FROM partner WHERE name = ? ORDER BY createdAt DESC LIMIT 1",
      [name]
    );

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error creating partner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, logo, link } = body;

    if (!id || (!name && !logo && !link)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Update partner
    const updateFields: string[] = [];
    const updateParams: DatabaseValue[] = [];

    if (name) {
      updateFields.push("name = ?");
      updateParams.push(name);
    }
    if (logo) {
      updateFields.push("logo = ?");
      updateParams.push(logo);
    }
    if (link) {
      updateFields.push("link = ?");
      updateParams.push(normalizePartnerLink(link));
    }

    updateFields.push("updatedAt = NOW()");
    updateParams.push(id);

    await query(
      `UPDATE partner SET ${updateFields.join(", ")} WHERE id = ?`,
      updateParams
    );

    const [partner] = await query<Partner>("SELECT * FROM partner WHERE id = ?", [id]);

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating partner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Missing partner ID", { status: 400 });
    }

    await query("DELETE FROM partner WHERE id = ?", [id]);

    return new NextResponse("Partner deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}