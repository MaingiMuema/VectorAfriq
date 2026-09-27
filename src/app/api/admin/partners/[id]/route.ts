import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";

function normalizePartnerLink(link: string): string {
  if (!link) return link;
  if (link.startsWith("http://") || link.startsWith("https://")) return link;
  return `https://${link}`;
}

export async function PUT(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, logo, link } = body;

    if (!id || (!name && !logo && !link)) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // First check if partner exists
    const [existingPartner] = await query<{ id: string }>(
      "SELECT id FROM partner WHERE id = ?",
      [id]
    );

    if (!existingPartner) {
      return new NextResponse("Partner not found", { status: 404 });
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

    // Fetch updated partner
    const [partner] = await query(
      "SELECT * FROM partner WHERE id = ?",
      [id]
    );

    return NextResponse.json(partner);
  } catch (error) {
    console.error("Error updating partner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.pathname.split('/').pop();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {

    if (!id) {
      return new NextResponse("Missing partner ID", { status: 400 });
    }

    // First check if partner exists
    const [existingPartner] = await query<{ id: string }>(
      "SELECT id FROM partner WHERE id = ?",
      [id]
    );

    if (!existingPartner) {
      return new NextResponse("Partner not found", { status: 404 });
    }

    // Delete partner
    await query("DELETE FROM partner WHERE id = ?", [id]);

    return new NextResponse("Partner deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting partner:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}