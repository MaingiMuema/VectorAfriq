import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, DatabaseValue } from "@/lib/db";
import { pool } from "@/lib/db";

// Define transaction status and type
const TransactionStatus = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
} as const;

const TransactionType = {
  SALE: "SALE",
  RENT: "RENT",
} as const;

type TransactionStatus =
  (typeof TransactionStatus)[keyof typeof TransactionStatus];
type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  propertyId: string;
  buyerId: string;
  sellerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status")?.trim() as
      | TransactionStatus
      | undefined;
    const type = searchParams.get("type")?.trim() as
      | TransactionType
      | undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    let whereClause = "WHERE 1=1";
    const params: DatabaseValue[] = [];

    if (search) {
      whereClause += ` AND (
        p.title LIKE ? OR 
        buyer.name LIKE ? OR 
        seller.name LIKE ?
      )`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      whereClause += " AND t.status = ?";
      params.push(status);
    }

    if (type) {
      whereClause += " AND t.type = ?";
      params.push(type);
    }

    // Get total count
    const [countResult] = await query<{ total: number }>(
      `
      SELECT COUNT(*) as total
      FROM transaction t
      LEFT JOIN property p ON t.propertyId = p.id
      LEFT JOIN user buyer ON t.buyerId = buyer.id
      LEFT JOIN user seller ON t.sellerId = seller.id
      ${whereClause}
    `,
      params
    );

    const total = countResult.total;

    // Get transactions with relationships
    const transactions = await query<
      Transaction & {
        property: string;
        buyer: string;
        seller: string;
      }
    >(
      `
      SELECT 
        t.*,
        JSON_OBJECT(
          'title', p.title,
          'price', p.price,
          'status', p.status
        ) as property,
        JSON_OBJECT(
          'name', buyer.name,
          'email', buyer.email
        ) as buyer,
        JSON_OBJECT(
          'name', seller.name,
          'email', seller.email
        ) as seller
      FROM transaction t
      LEFT JOIN property p ON t.propertyId = p.id
      LEFT JOIN user buyer ON t.buyerId = buyer.id
      LEFT JOIN user seller ON t.sellerId = seller.id
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `,
      [...params, limit, skip]
    );

    // Format the response
    const formattedTransactions = transactions.map((transaction) => ({
      ...transaction,
      property: JSON.parse(transaction.property as string),
      buyer: JSON.parse(transaction.buyer as string),
      seller: JSON.parse(transaction.seller as string),
    }));

    return NextResponse.json({
      transactions: formattedTransactions,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data = await request.json();
    const { id, status } = data;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Start transaction
    await connection.beginTransaction();

    // Check if transaction exists
    const [transaction] = await query<Transaction>(
      "SELECT * FROM transaction WHERE id = ?",
      [id]
    );

    if (!transaction) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Type-safe status transitions mapping
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      PENDING: ["COMPLETED", "CANCELLED"],
      COMPLETED: ["REFUNDED"],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowedStatuses = validTransitions[transaction.status];
    if (!allowedStatuses.includes(status as TransactionStatus)) {
      await connection.rollback();
      return NextResponse.json(
        {
          error: `Invalid status transition from ${transaction.status} to ${status}`,
        },
        { status: 400 }
      );
    }

    // Update transaction status
    await query(
      "UPDATE transaction SET status = ?, updatedAt = NOW() WHERE id = ?",
      [status, id]
    );

    // Update property status if transaction is completed
    if (status === "COMPLETED") {
      await query("UPDATE property SET status = ? WHERE id = ?", [
        transaction.type === "SALE" ? "SOLD" : "RENTED",
        transaction.propertyId,
      ]);
    }

    // Commit transaction
    await connection.commit();

    // Fetch updated transaction with relationships
    const [updatedTransaction] = await query<
      Transaction & {
        property: string;
        buyer: string;
        seller: string;
      }
    >(
      `
      SELECT 
        t.*,
        JSON_OBJECT(
          'title', p.title,
          'price', p.price,
          'status', p.status
        ) as property,
        JSON_OBJECT(
          'name', buyer.name,
          'email', buyer.email
        ) as buyer,
        JSON_OBJECT(
          'name', seller.name,
          'email', seller.email
        ) as seller
      FROM transaction t
      LEFT JOIN property p ON t.propertyId = p.id
      LEFT JOIN user buyer ON t.buyerId = buyer.id
      LEFT JOIN user seller ON t.sellerId = seller.id
      WHERE t.id = ?
    `,
      [id]
    );

    return NextResponse.json({
      ...updatedTransaction,
      property: JSON.parse(updatedTransaction.property as string),
      buyer: JSON.parse(updatedTransaction.buyer as string),
      seller: JSON.parse(updatedTransaction.seller as string),
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
