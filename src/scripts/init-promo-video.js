#!/usr/bin/env node

/**
 * Initialize the Promo Video Generator table.
 * Run with: node --env-file=.env src/scripts/init-promo-video.js
 * Or: npm run init-promo-video
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializePromoVideoTable() {
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

    const schemaPath = path.join(__dirname, '../utils/promo-video-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

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
        const tableMatch = statement.match(/CREATE TABLE.*?`(\w+)`/i);
        if (tableMatch) console.log(`  ✓ Table ${tableMatch[1]} ready`);
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.errno === 1050) {
          console.log('  ℹ Table already exists (skipping)');
        } else {
          console.error('  ✗ Error:', error.message.substring(0, 150));
        }
      }
    }

    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'promo_video_job'`,
      [process.env.DB_NAME || 'propertyfinder']
    );

    if (tables.length === 1) {
      console.log('\n✅ Promo Video Generator table initialized: promo_video_job');
      console.log('\n📋 Next steps:');
      console.log('  1. Visit /admin/promo-video');
      console.log('  2. Enter a brief and click "Generate Video"');
      console.log('  3. Download the finished mp4 when the job completes');
    } else {
      console.log('\n⚠️  Table missing. Check errors above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error initializing Promo Video table:', error);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initializePromoVideoTable();
