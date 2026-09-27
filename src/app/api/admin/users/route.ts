import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, type DatabaseValue } from "@/lib/db";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  avatar: string | null;
  isActive: number | boolean;
  deactivatedAt: Date | null;
  deactivatedBy: string | null;
  rateCardTier?: string;
  listingQuota?: number;
  rateCardPlanId?: string | null;
  rateCardExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  properties_count: number;
  favorites_count: number;
}

function formatUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: Boolean(user.isActive),
    deactivatedAt: user.deactivatedAt,
    deactivatedBy: user.deactivatedBy,
    rateCardTier: user.rateCardTier || "NONE",
    listingQuota: Number(user.listingQuota ?? 5),
    rateCardPlanId: user.rateCardPlanId || null,
    rateCardExpiresAt: user.rateCardExpiresAt || null,
    image: user.avatar || user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    _count: {
      properties: Number(user.properties_count),
      favorites: Number(user.favorites_count),
    },
  };
}

async function getUserWithCounts(id: string): Promise<User | null> {
  const [user] = await query<User>(
    `
    SELECT 
      u.*,
      COUNT(DISTINCT p.id) as properties_count,
      COUNT(DISTINCT f.id) as favorites_count
    FROM user u
    LEFT JOIN property p ON u.id = p.userId
    LEFT JOIN favorite f ON u.id = f.userId
    WHERE u.id = ?
    GROUP BY u.id
  `,
    [id]
  );
  return user ?? null;
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
    const role = searchParams.get("role");
    const status = searchParams.get("status"); // active | inactive | ALL

    const skip = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereClause += " AND u.role = ?";
      params.push(role);
    }

    if (status === "active") {
      whereClause += " AND u.isActive = 1";
    } else if (status === "inactive") {
      whereClause += " AND u.isActive = 0";
    }

    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total 
      FROM user u
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    const users = await query<User>(
      `
      SELECT 
        u.*,
        COUNT(DISTINCT p.id) as properties_count,
        COUNT(DISTINCT f.id) as favorites_count
      FROM user u
      LEFT JOIN property p ON u.id = p.userId
      LEFT JOIN favorite f ON u.id = f.userId
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    return NextResponse.json({
      users: users.map(formatUser),
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
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
    const { id, role, isActive, listingQuota, rateCardTier } = body;

    if (!id) {
      return new NextResponse("Missing user ID", { status: 400 });
    }

    if (
      role === undefined &&
      isActive === undefined &&
      listingQuota === undefined &&
      rateCardTier === undefined
    ) {
      return new NextResponse("Nothing to update", { status: 400 });
    }

    // Prevent admin from deactivating or demoting themselves
    if (id === session.user.id) {
      if (isActive === false) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 }
        );
      }
      if (role && role !== "ADMIN") {
        return NextResponse.json(
          { error: "You cannot change your own admin role" },
          { status: 400 }
        );
      }
    }

    if (role !== undefined) {
      const validRoles = ["USER", "ADMIN", "AGENT"];
      if (!validRoles.includes(role)) {
        return new NextResponse("Invalid role", { status: 400 });
      }
      await query("UPDATE user SET role = ?, updatedAt = NOW() WHERE id = ?", [
        role,
        id,
      ]);
    }

    if (isActive !== undefined) {
      const active = Boolean(isActive);
      if (active) {
        await query(
          `UPDATE user SET isActive = 1, deactivatedAt = NULL, deactivatedBy = NULL, updatedAt = NOW() WHERE id = ?`,
          [id]
        );
      } else {
        await query(
          `UPDATE user SET isActive = 0, deactivatedAt = NOW(), deactivatedBy = ?, updatedAt = NOW() WHERE id = ?`,
          [session.user.id, id]
        );
      }
    }

    if (listingQuota !== undefined) {
      const allowed = [5, 15, 30, 60, 100, 150, 200, 400, 1000];
      const quota = Number(listingQuota);
      // Allow standard admin tiers; also accept existing plan-granted limits
      if (!Number.isFinite(quota) || quota < 0 || quota > 10000) {
        return NextResponse.json(
          { error: "listingQuota must be between 0 and 10000" },
          { status: 400 }
        );
      }
      if (!allowed.includes(quota) && !Number.isInteger(quota)) {
        return NextResponse.json(
          {
            error: `listingQuota must be one of: ${allowed.join(", ")}`,
          },
          { status: 400 }
        );
      }
      await query(
        `UPDATE user SET listingQuota = ?, updatedAt = NOW() WHERE id = ?`,
        [quota, id]
      );
    }

    if (rateCardTier !== undefined) {
      const tiers = ["NONE", "SILVER", "GOLD", "PLATINUM"];
      if (!tiers.includes(rateCardTier)) {
        return NextResponse.json(
          { error: "Invalid rateCardTier" },
          { status: 400 }
        );
      }
      await query(
        `UPDATE user SET rateCardTier = ?, updatedAt = NOW() WHERE id = ?`,
        [rateCardTier, id]
      );
    }

    const user = await getUserWithCounts(id);

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    return NextResponse.json(formatUser(user));
  } catch (error) {
    console.error("Error updating user:", error);
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
      return new NextResponse("Missing user ID", { status: 400 });
    }

    if (id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    await query("DELETE FROM favorite WHERE userId = ?", [id]);
    await query("DELETE FROM property WHERE userId = ?", [id]);
    await query("DELETE FROM user WHERE id = ?", [id]);

    return new NextResponse("User deleted successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
