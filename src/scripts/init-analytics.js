/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeAnalytics() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'propertyfinder',
    });

    console.log('Connected to database');

    // Read the analytics schema file
    const schemaPath = path.join(__dirname, '../utils/analytics-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log('✓ Executed statement successfully');
      } catch (error) {
        console.error('✗ Error executing statement:', error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }

    console.log('Analytics database initialization completed!');

    // Verify tables were created
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('analytics_config', 'site_visitor', 'page_view', 'property_view')
    `, [process.env.DB_NAME || 'propertyfinder']);

    console.log('Created tables:', tables.map(t => t.TABLE_NAME));

    // Check if default configuration was inserted
    const [configs] = await connection.execute('SELECT COUNT(*) as count FROM analytics_config');
    console.log(`Analytics configuration entries: ${configs[0].count}`);

  } catch (error) {
    console.error('Error initializing analytics:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the initialization
if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  initializeAnalytics();
}

module.exports = initializeAnalytics;
