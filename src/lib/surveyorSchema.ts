import { query } from "@/lib/db";

let schemaReady: Promise<void> | null = null;

async function tableExists(tableName: string) {
  const [result] = await query<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [tableName]
  );
  return (result?.cnt ?? 0) > 0;
}

async function columnExists(tableName: string, columnName: string) {
  const [column] = await query<{ columnName: string }>(
    `
    SELECT COLUMN_NAME as columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );

  return Boolean(column);
}

async function createSurveyorProfilesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS \`surveyor_profiles\` (
      \`id\` varchar(191) NOT NULL,
      \`userId\` varchar(191) NOT NULL,
      \`professionalType\` enum('SURVEYOR','LEGAL','BOTH') NOT NULL DEFAULT 'SURVEYOR',
      \`businessName\` varchar(191) NOT NULL,
      \`contactPhone\` varchar(64) NOT NULL,
      \`contactEmail\` varchar(191) DEFAULT NULL,
      \`licenseNumber\` varchar(191) DEFAULT NULL,
      \`licenseDocumentUrl\` varchar(500) DEFAULT NULL,
      \`idNumber\` varchar(191) NOT NULL,
      \`idDocumentUrl\` varchar(500) DEFAULT NULL,
      \`qualification\` varchar(191) DEFAULT NULL,
      \`experience\` varchar(191) DEFAULT NULL,
      \`bio\` text,
      \`profileImageUrl\` varchar(500) DEFAULT NULL,
      \`location\` varchar(191) NOT NULL,
      \`serviceAreas\` text,
      \`specializations\` text,
      \`hourlyRate\` double DEFAULT NULL,
      \`consultationFee\` double DEFAULT NULL,
      \`availableOnline\` tinyint(1) NOT NULL DEFAULT 1,
      \`availabilityStatus\` enum('AVAILABLE','BUSY','OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
      \`approvalStatus\` enum('PENDING','APPROVED','REJECTED','SUSPENDED','BANNED') NOT NULL DEFAULT 'PENDING',
      \`reviewNotes\` text,
      \`averageRating\` double NOT NULL DEFAULT 0,
      \`totalReviews\` int NOT NULL DEFAULT 0,
      \`totalJobs\` int NOT NULL DEFAULT 0,
      \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`surveyor_profiles_userId_key\` (\`userId\`),
      KEY \`surveyor_profiles_approval_idx\` (\`approvalStatus\`),
      KEY \`surveyor_profiles_type_idx\` (\`professionalType\`),
      KEY \`surveyor_profiles_location_idx\` (\`location\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function ensureSurveyorSchemaInternal() {
  // Create the table if it doesn't exist
  if (!(await tableExists("surveyor_profiles"))) {
    await createSurveyorProfilesTable();
  }

  // Ensure any columns added after the initial migration exist
  const requiredColumns = [
    {
      table: "surveyor_profiles",
      name: "profileImageUrl",
      definition:
        "ADD COLUMN `profileImageUrl` varchar(500) DEFAULT NULL AFTER `bio`",
    },
    {
      table: "surveyor_profiles",
      name: "licenseDocumentUrl",
      definition:
        "ADD COLUMN `licenseDocumentUrl` varchar(500) DEFAULT NULL AFTER `licenseNumber`",
    },
    {
      table: "surveyor_profiles",
      name: "idDocumentUrl",
      definition:
        "ADD COLUMN `idDocumentUrl` varchar(500) DEFAULT NULL AFTER `idNumber`",
    },
  ];

  for (const column of requiredColumns) {
    if (!(await columnExists(column.table, column.name))) {
      await query(`ALTER TABLE \`${column.table}\` ${column.definition}`);
    }
  }
}

export async function ensureSurveyorProfileSchema() {
  if (!schemaReady) {
    schemaReady = ensureSurveyorSchemaInternal().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
