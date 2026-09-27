#!/usr/bin/env node

/**
 * Test script to verify database connectivity and data
 * Run with: node src/scripts/test-database.js
 */

import mysql from 'mysql2/promise';

async function testDatabase() {
  console.log('🔍 Testing Database Connectivity...\n');
  
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'propertyfinder',
      port: process.env.DB_PORT || 3306
    });
    
    console.log('✅ Database connection successful\n');
    
    // Test location tables
    console.log('🗺️  Testing Location Tables...');
    
    const [countyCount] = await connection.execute('SELECT COUNT(*) as count FROM county');
    const [cityCount] = await connection.execute('SELECT COUNT(*) as count FROM city');
    const [neighborhoodCount] = await connection.execute('SELECT COUNT(*) as count FROM neighborhood');
    
    console.log(`   Counties: ${countyCount[0].count}`);
    console.log(`   Cities: ${cityCount[0].count}`);
    console.log(`   Neighborhoods: ${neighborhoodCount[0].count}`);
    
    // Show sample data
    console.log('\n📝 Sample Location Data:');
    
    const [counties] = await connection.execute('SELECT name, slug FROM county LIMIT 3');
    const [cities] = await connection.execute('SELECT name, slug FROM city LIMIT 3');
    const [neighborhoods] = await connection.execute('SELECT name, slug FROM neighborhood LIMIT 3');
    
    console.log('   Counties:');
    counties.forEach(county => {
      console.log(`      - ${county.name} (${county.slug})`);
    });
    
    console.log('   Cities:');
    cities.forEach(city => {
      console.log(`      - ${city.name} (${city.slug})`);
    });
    
    console.log('   Neighborhoods:');
    neighborhoods.forEach(neighborhood => {
      console.log(`      - ${neighborhood.name} (${neighborhood.slug})`);
    });
    
    // Test property table
    console.log('\n🏠 Testing Property Table...');
    
    const [propertyCount] = await connection.execute('SELECT COUNT(*) as count FROM property');
    console.log(`   Total Properties: ${propertyCount[0].count}`);
    
    // Show sample properties
    const [properties] = await connection.execute(`
      SELECT id, title, type, location, price 
      FROM property 
      LIMIT 3
    `);
    
    console.log('   Sample Properties:');
    properties.forEach(property => {
      console.log(`      - ${property.title} (${property.type}) - ${property.location} - ${property.price}`);
    });
    
    console.log('\n✅ Database test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Database connection: ✅ Working`);
    console.log(`   - Location data: ✅ Available (${countyCount[0].count + cityCount[0].count + neighborhoodCount[0].count} total locations)`);
    console.log(`   - Property data: ✅ Available (${propertyCount[0].count} properties)`);
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your database connection settings');
    console.log('2. Verify the database is running');
    console.log('3. Check your environment variables');
    console.log('4. Ensure the database schema is correct');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabase().catch(console.error);
}

export { testDatabase };
