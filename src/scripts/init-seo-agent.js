#!/usr/bin/env node

/**
 * Initialize SEO Agent tables in the database.
 * Run with: node --env-file=.env src/scripts/init-seo-agent.js
 * Or: npm run init-seo-agent
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeSeoAgentTables() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'propertyfinder',
      multipleStatements: true,
    });

    console.log('Connected to database:', process.env.DB_NAME || 'propertyfinder');

    // Read the schema file
    const schemaPath = path.join(__dirname, '../utils/seo-agent-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split into statements on semicolons that end a line
    const statements = schema
      .split('\n')
      .reduce((acc, line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('--') || trimmed === '') return acc;
        acc.current += (acc.current ? '\n' : '') + line;
        if (trimmed.endsWith(';')) {
          acc.statements.push(acc.current);
          acc.current = '';
        }
        return acc;
      }, { statements: [], current: '' })
      .statements
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      try {
        await connection.execute(statement);
        // Extract table name from CREATE TABLE
        const tableMatch = statement.match(/CREATE TABLE.*?`(\w+)`/i);
        if (tableMatch) {
          console.log(`  ✓ Table ${tableMatch[1]} ready`);
        }
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.errno === 1050) {
          console.log(`  ℹ Table already exists (skipping)`);
        } else {
          console.error(`  ✗ Error:`, error.message.substring(0, 150));
        }
      }
    }

    // Verify all tables exist
    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME IN ('seo_agent_run', 'seo_keyword', 'seo_optimization_task', 'seo_ranking', 'seo_content_gap', 'seo_technical_issue')`,
      [process.env.DB_NAME || 'propertyfinder']
    );

    console.log(`\n✅ SEO Agent tables initialized: ${tables.map(t => t.TABLE_NAME).join(', ')}`);
    console.log(`   Total tables: ${tables.length}/6`);

    if (tables.length < 6) {
      console.log('\n⚠️  Some tables are missing. Check errors above.');
      process.exit(1);
    }

    console.log('\n📋 Next steps:');
    console.log('  1. Visit /admin/seo/agent to see the dashboard');
    console.log('  2. Click "Run All Agents" to start the first analysis');
    console.log('  3. Review optimization tasks in the Optimization Queue tab');

  } catch (error) {
    console.error('Error initializing SEO Agent tables:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initializeSeoAgentTables();
