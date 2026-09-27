/**
 * Migration script to move banner images from "banners" directory to "media" directory on FTP
 * This helps avoid adblocker issues by removing the word "banners" from URLs
 */

import { Client } from 'basic-ftp';

const FTP_CONFIG = {
  host: process.env.FTP_HOST || "ftp.vectorafriqproperties.co.ke",
  user: process.env.FTP_USER || "Properties@uat.com.vectorafriqproperties.co.ke",
  password: process.env.FTP_PASSWORD || "",
  port: Number(process.env.FTP_PORT) || 21,
  secure: process.env.FTP_SECURE === "true" || false,
};

async function migrateBannerFiles() {
  const client = new Client();
  
  try {
    console.log('Connecting to FTP server...');
    await client.access(FTP_CONFIG);
    
    // Navigate to root
    await client.cd('/');
    
    // Check if banners directory exists
    try {
      await client.cd('banners');
      console.log('Found existing banners directory');
    } catch {
      console.log('No banners directory found, nothing to migrate');
      return;
    }
    
    // Get list of files in banners directory
    const files = await client.list();
    console.log(`Found ${files.length} files in banners directory`);
    
    if (files.length === 0) {
      console.log('No files to migrate');
      return;
    }
    
    // Navigate back to root and ensure media directory exists
    await client.cd('/');
    try {
      await client.cd('media');
    } catch {
      console.log('Creating media directory...');
      await client.send('MKD media');
      await client.cd('media');
    }
    
    // Navigate back to root for file operations
    await client.cd('/');
    
    // Move each file from banners to media
    for (const file of files) {
      if (file.type === 1) { // Regular file
        try {
          console.log(`Moving ${file.name}...`);
          
          // Use FTP RENAME command to move file
          await client.send(`RNFR banners/${file.name}`);
          await client.send(`RNTO media/${file.name}`);
          
          console.log(`✓ Moved ${file.name}`);
        } catch (error) {
          console.error(`✗ Failed to move ${file.name}:`, error.message);
        }
      }
    }
    
    // Try to remove empty banners directory
    try {
      await client.send('RMD banners');
      console.log('✓ Removed empty banners directory');
    } catch (error) {
      console.log('Could not remove banners directory (may not be empty):', error.message);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    client.close();
  }
}

// Run the migration
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateBannerFiles().catch(console.error);
}

export { migrateBannerFiles };
