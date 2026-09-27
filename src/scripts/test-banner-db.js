/**
 * Test script to check banner database table and connection
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testBannerDatabase() {
  let connection;
  
  try {
    console.log('Testing database connection...');
    
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'propertyfinder',
    });

    console.log('✓ Connected to database successfully');

    // Check if banner table exists
    console.log('\nChecking if banner table exists...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'banner'
    `, [process.env.DB_NAME || 'propertyfinder']);

    if (tables.length === 0) {
      console.log('✗ Banner table does not exist');
      
      // Show available tables
      const [allTables] = await connection.execute(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = ?
      `, [process.env.DB_NAME || 'propertyfinder']);
      
      console.log('Available tables:', allTables.map(t => t.TABLE_NAME));
      return;
    }

    console.log('✓ Banner table exists');

    // Check table structure
    console.log('\nChecking banner table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'banner'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'propertyfinder']);

    console.log('Banner table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} (nullable: ${col.IS_NULLABLE}, default: ${col.COLUMN_DEFAULT})`);
    });

    // Check if there are any banners
    console.log('\nChecking banner data...');
    const [banners] = await connection.execute('SELECT COUNT(*) as count FROM banner');
    console.log(`Total banners: ${banners[0].count}`);

    if (banners[0].count > 0) {
      const [activeBanners] = await connection.execute('SELECT COUNT(*) as count FROM banner WHERE active = TRUE');
      console.log(`Active banners: ${activeBanners[0].count}`);

      // Show sample banner data
      const [sampleBanners] = await connection.execute('SELECT id, title, imageUrl, active FROM banner LIMIT 3');
      console.log('Sample banners:');
      sampleBanners.forEach(banner => {
        console.log(`  - ${banner.title} (${banner.active ? 'active' : 'inactive'}): ${banner.imageUrl}`);
      });
    }

    console.log('\n✓ Database test completed successfully');

  } catch (error) {
    console.error('✗ Database test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testBannerDatabase().catch(console.error);
}

module.exports = { testBannerDatabase };
