/* eslint-disable @typescript-eslint/no-require-imports */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initializeSEO() {
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

    // Read the SEO schema file
    const schemaPath = path.join(__dirname, '../utils/seo-schema.sql');
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

    console.log('SEO database initialization completed!');

    // Verify tables were created
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('seo_config', 'page_meta', 'seo_redirect', 'seo_audit', 'sitemap_url')
    `, [process.env.DB_NAME || 'propertyfinder']);

    console.log('Created tables:', tables.map(t => t.TABLE_NAME));

    // Check if default configuration was inserted
    const [configs] = await connection.execute('SELECT COUNT(*) as count FROM seo_config');
    console.log(`SEO configuration entries: ${configs[0].count}`);

    const [pages] = await connection.execute('SELECT COUNT(*) as count FROM page_meta');
    console.log(`Page meta entries: ${pages[0].count}`);

    const [sitemapUrls] = await connection.execute('SELECT COUNT(*) as count FROM sitemap_url');
    console.log(`Sitemap URL entries: ${sitemapUrls[0].count}`);

  } catch (error) {
    console.error('Error initializing SEO:', error);
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
  initializeSEO();
}

module.exports = initializeSEO;
