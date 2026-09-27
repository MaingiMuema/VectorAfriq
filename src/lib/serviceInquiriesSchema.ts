import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

async function tableExists(tableName: string) {
  const [result] = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return (result?.cnt ?? 0) > 0;
}

async function createServiceInquiriesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`service_inquiries\` (
      \`id\` varchar(191) NOT NULL,
      \`servicePage\` varchar(191) NOT NULL,
      \`name\` varchar(191) NOT NULL,
      \`email\` varchar(191) NOT NULL,
      \`phone\` varchar(64) DEFAULT NULL,
      \`serviceType\` varchar(191) NOT NULL,
      \`location\` varchar(191) DEFAULT NULL,
      \`propertyUrl\` varchar(512) DEFAULT NULL,
      \`message\` text NOT NULL,
      \`extraFields\` longtext DEFAULT NULL,
      \`status\` enum('NEW','READ','REPLIED','CLOSED') NOT NULL DEFAULT 'NEW',
      \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`service_inquiries_status_idx\` (\`status\`),
      KEY \`service_inquiries_servicePage_idx\` (\`servicePage\`),
      KEY \`service_inquiries_created_idx\` (\`createdAt\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function addExtraFieldsColumn() {
  const [cols] = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'service_inquiries' AND COLUMN_NAME = 'extraFields'`
  );
  if ((cols?.cnt ?? 0) === 0) {
    await query(`ALTER TABLE \`service_inquiries\` ADD COLUMN \`extraFields\` longtext DEFAULT NULL AFTER \`message\``);
  }
}

async function ensureServiceInquiriesSchemaInternal() {
  if (!(await tableExists("service_inquiries"))) {
    await createServiceInquiriesTable();
  } else {
    await addExtraFieldsColumn();
  }
}

export async function ensureServiceInquiriesSchema() {
  if (!schemaReady) {
    schemaReady = ensureServiceInquiriesSchemaInternal().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
