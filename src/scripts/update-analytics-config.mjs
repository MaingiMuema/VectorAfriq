import mysql from 'mysql2/promise';
import { config } from 'dotenv';

config();

async function updateAnalyticsConfig() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('Connected to database successfully');

    // Update Google Analytics ID
    await connection.execute(
      `UPDATE analytics_config 
       SET value = 'G-G7S5D94G6G', isActive = true, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE \`key\` = 'GOOGLE_ANALYTICS_ID'`
    );

    // Enable Google Analytics
    await connection.execute(
      `UPDATE analytics_config 
       SET value = 'true', isActive = true, updatedAt = CURRENT_TIMESTAMP(3)
       WHERE \`key\` = 'GOOGLE_ANALYTICS_ENABLED'`
    );

    console.log('Google Analytics configuration updated successfully');
    console.log('- Measurement ID: G-G7S5D94G6G');
    console.log('- Status: Enabled');

  } catch (error) {
    console.error('Error updating analytics configuration:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the update
updateAnalyticsConfig();