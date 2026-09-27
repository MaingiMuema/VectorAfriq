const mysql = require('mysql2/promise');

async function migrateBannerSchema() {
  let connection;

  try {
    // Database connection configuration
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'propertyfinder',
      port: process.env.DB_PORT || 3306,
    });

    console.log('Connected to database');

    // Check if categories column exists
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM banner LIKE 'categories'"
    );

    if (columns.length === 0) {
      console.log('Adding categories column...');
      await connection.execute(
        "ALTER TABLE banner ADD COLUMN categories TEXT AFTER imageUrl"
      );
      console.log('Categories column added successfully');
    } else {
      console.log('Categories column already exists');
    }

    // Check if title and description columns exist and remove them
    const [allColumns] = await connection.execute(
      "SHOW COLUMNS FROM banner"
    );

    const columnNames = allColumns.map(col => col.Field);
    console.log('Current columns:', columnNames);

    if (columnNames.includes('title')) {
      console.log('Removing title column...');
      await connection.execute(
        "ALTER TABLE banner DROP COLUMN title"
      );
      console.log('Title column removed successfully');
    }

    if (columnNames.includes('description')) {
      console.log('Removing description column...');
      await connection.execute(
        "ALTER TABLE banner DROP COLUMN description"
      );
      console.log('Description column removed successfully');
    }

    // Convert existing banners to have categories as JSON array
    console.log('Converting existing banners to have categories...');
    const [banners] = await connection.execute(
      "SELECT id FROM banner WHERE categories IS NULL OR categories = ''"
    );

    if (banners.length > 0) {
      console.log(`Updating ${banners.length} banners to have empty categories array...`);
      await connection.execute(
        "UPDATE banner SET categories = '[]' WHERE categories IS NULL OR categories = ''"
      );
      console.log('Banners updated successfully');
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
migrateBannerSchema().catch(console.error);
