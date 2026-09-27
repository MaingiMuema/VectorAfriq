import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

async function tableExists(tableName: string) {
  const [result] = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return (result?.cnt ?? 0) > 0;
}

async function createReviewsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`surveyor_reviews\` (
      \`id\` varchar(191) NOT NULL,
      \`professionalId\` varchar(191) NOT NULL,
      \`userId\` varchar(191) DEFAULT NULL,
      \`reviewerName\` varchar(191) NOT NULL,
      \`reviewerEmail\` varchar(191) NOT NULL,
      \`rating\` int NOT NULL,
      \`title\` varchar(191) DEFAULT NULL,
      \`comment\` text,
      \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`surveyor_reviews_professional_idx\` (\`professionalId\`),
      KEY \`surveyor_reviews_rating_idx\` (\`rating\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureReviewsSchemaInternal() {
  if (!(await tableExists("surveyor_reviews"))) {
    await createReviewsTable();
  }
}

export async function ensureReviewsSchema() {
  if (!schemaReady) {
    schemaReady = ensureReviewsSchemaInternal().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
