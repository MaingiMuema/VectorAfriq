import mysql from 'mysql2/promise';

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'propertyfinder',
  });

  try {
    console.log('Running password reset table migration...');
    
    const migrationSQL = `
      CREATE TABLE IF NOT EXISTS \`password_reset_token\` (
        \`id\` varchar(191) NOT NULL,
        \`email\` varchar(191) NOT NULL,
        \`token\` varchar(191) NOT NULL,
        \`expires\` datetime(3) NOT NULL,
        \`used\` boolean NOT NULL DEFAULT false,
        \`createdAt\` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`PasswordResetToken_token_key\` (\`token\`),
        KEY \`PasswordResetToken_email_idx\` (\`email\`),
        KEY \`PasswordResetToken_expires_idx\` (\`expires\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(migrationSQL);
    console.log('Password reset table migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run the migration
runMigration().catch(console.error);
