#!/usr/bin/env node

/**
 * Initialize all tables/columns added by the SEO Agent Upgrade Spec
 * (docs/SEO_AGENT_UPGRADE_SPEC.md). Idempotent — safe to re-run.
 *
 * Run with: node --env-file=.env src/scripts/init-seo-upgrade.js
 * Or: npm run init-seo-upgrade
 *
 * Follows the same statement-splitting/tolerate-existing-error pattern as
 * src/scripts/init-seo-agent.js. Unlike that script, migrations here also
 * include ALTER TABLE / data-backfill statements, so in addition to
 * ER_TABLE_EXISTS_ERROR (1050) we tolerate ER_DUP_FIELDNAME (1060) and
 * ER_DUP_KEYNAME (1061) — both mean "already applied by a previous run".
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Ordered — later migrations may assume earlier ones already ran.
const MIGRATION_FILES = [
  "202601_seo_page_override.sql",
  "202602_seo_agent_job.sql",
  "202603_seo_fingerprint_columns.sql",
  "202604_seo_serp_provider.sql",
  "202605_seo_gsc_tables.sql",
  "202606_seo_vitals.sql",
  "202607_seo_autonomy.sql",
  "202608_seo_outcome.sql",
];

const TOLERABLE_ERRNOS = new Set([
  1050, // ER_TABLE_EXISTS_ERROR
  1060, // ER_DUP_FIELDNAME
  1061, // ER_DUP_KEYNAME
  1068, // ER_MULTIPLE_PRI_KEY
]);

function splitStatements(sql) {
  return sql
    .split("\n")
    .reduce(
      (acc, line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("--") || trimmed === "") return acc;
        acc.current += (acc.current ? "\n" : "") + line;
        if (trimmed.endsWith(";")) {
          acc.statements.push(acc.current);
          acc.current = "";
        }
        return acc;
      },
      { statements: [], current: "" }
    )
    .statements.filter((stmt) => stmt.length > 0);
}

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "propertyfinder",
      multipleStatements: true,
    });

    console.log("Connected to database:", process.env.DB_NAME || "propertyfinder");

    for (const filename of MIGRATION_FILES) {
      const filePath = path.join(__dirname, "../utils/migrations", filename);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⚠ Skipping ${filename} (not created yet)`);
        continue;
      }

      const sql = fs.readFileSync(filePath, "utf8");
      const statements = splitStatements(sql);
      console.log(`\n${filename}: executing ${statements.length} statements...`);

      for (const statement of statements) {
        try {
          await connection.execute(statement);
          const tableMatch = statement.match(/(?:CREATE TABLE|ALTER TABLE)[^`]*`(\w+)`/i);
          console.log(`  ✓ ${tableMatch ? tableMatch[1] : "statement"} applied`);
        } catch (error) {
          if (TOLERABLE_ERRNOS.has(error.errno)) {
            console.log(`  ℹ Already applied (errno ${error.errno}), skipping`);
          } else {
            console.error(`  ✗ Error:`, error.message.substring(0, 300));
          }
        }
      }
    }

    console.log("\n✅ SEO upgrade migrations complete.");
  } catch (error) {
    console.error("Error running SEO upgrade migrations:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();
