import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

async function tableExists(tableName: string) {
  const [result] = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return (result?.cnt ?? 0) > 0;
}

async function createInquiriesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`surveyor_inquiries\` (
      \`id\` varchar(191) NOT NULL,
      \`name\` varchar(191) NOT NULL,
      \`email\` varchar(191) NOT NULL,
      \`phone\` varchar(64) DEFAULT NULL,
      \`serviceType\` varchar(191) NOT NULL,
      \`location\` varchar(191) DEFAULT NULL,
      \`message\` text NOT NULL,
      \`status\` enum('NEW','READ','REPLIED','CLOSED') NOT NULL DEFAULT 'NEW',
      \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`surveyor_inquiries_status_idx\` (\`status\`),
      KEY \`surveyor_inquiries_created_idx\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureInquiriesSchemaInternal() {
  if (!(await tableExists("surveyor_inquiries"))) {
    await createInquiriesTable();
  }
}

export async function ensureInquiriesSchema() {
  if (!schemaReady) {
    schemaReady = ensureInquiriesSchemaInternal().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
