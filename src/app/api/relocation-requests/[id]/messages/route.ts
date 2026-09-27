import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { v4 as uuidv4 } from "uuid";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import type { RelocationRequestMessage } from "@/types/logistics";

interface RequestParticipantRow {
  userId: string;
  moverUserId: string | null;
}

interface MessageRow extends RelocationRequestMessage {
  senderName: string | null;
}

let messagesTableReady: Promise<unknown> | null = null;

function getRequestId(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments[segments.length - 2];
}

function ensureMessagesTable() {
  messagesTableReady ??= query(`
    CREATE TABLE IF NOT EXISTS relocation_request_messages (
      id varchar(191) NOT NULL,
      requestId varchar(191) NOT NULL,
      senderId varchar(191) NOT NULL,
      senderRole enum('CUSTOMER','MOVER','ADMIN') NOT NULL,
      message text NOT NULL,
      createdAt datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY relocation_request_messages_request_idx (requestId, createdAt),
      KEY relocation_request_messages_sender_idx (senderId),
      CONSTRAINT relocation_request_messages_requestId_fkey
        FOREIGN KEY (requestId) REFERENCES relocation_requests (id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT relocation_request_messages_senderId_fkey
        FOREIGN KEY (senderId) REFERENCES \`user\` (id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  return messagesTableReady;
}

async function getParticipant(requestId: string) {
  const [request] = await query<RequestParticipantRow>(
    `
    SELECT rr.userId, mp.userId as moverUserId
    FROM relocation_requests rr
    LEFT JOIN mover_profiles mp ON mp.id = rr.moverId
    WHERE rr.id = ?
    `,
    [requestId]
  );

  return request || null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureMessagesTable();

    const requestId = getRequestId(request.nextUrl.pathname);
    const participant = await getParticipant(requestId);

    if (!participant) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isParticipant =
      participant.userId === session.user.id ||
      participant.moverUserId === session.user.id ||
      session.user.role === "ADMIN";

    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await query<MessageRow>(
      `
      SELECT rrm.*, u.name as senderName
      FROM relocation_request_messages rrm
      LEFT JOIN user u ON u.id = rrm.senderId
      WHERE rrm.requestId = ?
      ORDER BY rrm.createdAt ASC
      LIMIT 100
      `,
      [requestId]
    );

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[RELOCATION_MESSAGES_GET]", error);
    return NextResponse.json(
      { error: "Failed to fetch relocation messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureMessagesTable();

    const requestId = getRequestId(request.nextUrl.pathname);
    const participant = await getParticipant(requestId);

    if (!participant) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const isCustomer = participant.userId === session.user.id;
    const isMover = participant.moverUserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN";

    if (!isCustomer && !isMover && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const senderRole = isAdmin ? "ADMIN" : isMover ? "MOVER" : "CUSTOMER";
    const id = uuidv4();

    await query(
      `
      INSERT INTO relocation_request_messages (
        id, requestId, senderId, senderRole, message, createdAt
      ) VALUES (?, ?, ?, ?, ?, NOW())
      `,
      [id, requestId, session.user.id, senderRole, message]
    );

    const [created] = await query<MessageRow>(
      `
      SELECT rrm.*, u.name as senderName
      FROM relocation_request_messages rrm
      LEFT JOIN user u ON u.id = rrm.senderId
      WHERE rrm.id = ?
      `,
      [id]
    );

    return NextResponse.json({ message: created });
  } catch (error) {
    console.error("[RELOCATION_MESSAGES_POST]", error);
    return NextResponse.json(
      { error: "Failed to send relocation message" },
      { status: 500 }
    );
  }
}
