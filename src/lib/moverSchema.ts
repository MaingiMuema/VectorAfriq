import { query } from "@/lib/db";

const requiredMoverColumns = [
  {
    name: "vehicleImageUrl",
    definition: "ADD COLUMN `vehicleImageUrl` varchar(500) DEFAULT NULL AFTER `vehiclePlate`",
  },
  {
    name: "driversLicenseBackUrl",
    definition:
      "ADD COLUMN `driversLicenseBackUrl` varchar(500) DEFAULT NULL AFTER `driversLicense`",
  },
  {
    name: "idBackUrl",
    definition: "ADD COLUMN `idBackUrl` varchar(500) DEFAULT NULL AFTER `idNumber`",
  },
];

let schemaReady: Promise<void> | null = null;

async function columnExists(columnName: string) {
  const [column] = await query<{ columnName: string }>(
    `
    SELECT COLUMN_NAME as columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'mover_profiles'
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [columnName]
  );

  return Boolean(column);
}

async function ensureMoverSchemaInternal() {
  await query(
    "ALTER TABLE `mover_profiles` MODIFY COLUMN `driversLicense` varchar(500) NOT NULL"
  );
  await query(
    "ALTER TABLE `mover_profiles` MODIFY COLUMN `idNumber` varchar(500) NOT NULL"
  );

  for (const column of requiredMoverColumns) {
    if (!(await columnExists(column.name))) {
      await query(`ALTER TABLE \`mover_profiles\` ${column.definition}`);
    }
  }
}

export async function ensureMoverProfileSchema() {
  if (!schemaReady) {
    schemaReady = ensureMoverSchemaInternal().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  return schemaReady;
}
