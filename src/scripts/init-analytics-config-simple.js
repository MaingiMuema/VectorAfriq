import mysql from 'mysql2/promise';

// Database configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "propertyfinder",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initAnalyticsConfig() {
  try {
    console.log('Initializing analytics configuration...');
    
    // Check if the table exists
    const [tableExists] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'analytics_config'
    `);
    
    if (tableExists[0].count === 0) {
      console.log('Creating analytics_config table...');
      await pool.execute(`
        CREATE TABLE analytics_config (
          id VARCHAR(255) PRIMARY KEY,
          \`key\` VARCHAR(255) NOT NULL UNIQUE,
          value TEXT,
          description TEXT,
          isActive BOOLEAN DEFAULT true,
          createdAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
          updatedAt DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        )
      `);
    }
    
    // Insert or update configuration values
    const configs = [
      {
        id: 'config_google_analytics_enabled',
        key: 'GOOGLE_ANALYTICS_ENABLED',
        value: 'false',
        description: 'Enable Google Analytics tracking',
        isActive: true
      },
      {
        id: 'config_google_analytics_id',
        key: 'GOOGLE_ANALYTICS_ID',
        value: '',
        description: 'Google Analytics Measurement ID (GA4)',
        isActive: true
      },
      {
        id: 'config_google_tag_manager_enabled',
        key: 'GOOGLE_TAG_MANAGER_ENABLED',
        value: 'false',
        description: 'Enable Google Tag Manager',
        isActive: true
      },
      {
        id: 'config_search_console_enabled',
        key: 'SEARCH_CONSOLE_ENABLED',
        value: 'false',
        description: 'Enable Google Search Console integration',
        isActive: true
      },
      {
        id: 'config_search_console_url',
        key: 'SEARCH_CONSOLE_URL',
        value: '',
        description: 'Google Search Console site URL',
        isActive: true
      },
      {
        id: 'config_enhanced_measurement_enabled',
        key: 'ENHANCED_MEASUREMENT_ENABLED',
        value: 'true',
        description: 'Enable Google Analytics enhanced measurement',
        isActive: true
      },
      {
        id: 'config_user_id_tracking_enabled',
        key: 'USER_ID_TRACKING_ENABLED',
        value: 'false',
        description: 'Enable user ID tracking',
        isActive: true
      },
      {
        id: 'config_cross_domain_tracking_enabled',
        key: 'CROSS_DOMAIN_TRACKING_ENABLED',
        value: 'false',
        description: 'Enable cross-domain tracking',
        isActive: true
      },
      {
        id: 'config_visitor_tracking_enabled',
        key: 'VISITOR_TRACKING_ENABLED',
        value: 'true',
        description: 'Enable visitor tracking',
        isActive: true
      },
      {
        id: 'config_property_view_tracking_enabled',
        key: 'PROPERTY_VIEW_TRACKING_ENABLED',
        value: 'true',
        description: 'Enable property view tracking',
        isActive: true
      },
      {
        id: 'config_data_retention_days',
        key: 'DATA_RETENTION_DAYS',
        value: '365',
        description: 'Number of days to retain analytics data',
        isActive: true
      },
      {
        id: 'config_ip_anonymization_enabled',
        key: 'IP_ANONYMIZATION_ENABLED',
        value: 'true',
        description: 'Enable IP address anonymization',
        isActive: true
      }
    ];
    
    for (const config of configs) {
      await pool.execute(`
        INSERT INTO analytics_config (id, \`key\`, value, description, isActive)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          value = VALUES(value),
          description = VALUES(description),
          isActive = VALUES(isActive),
          updatedAt = CURRENT_TIMESTAMP(3)
      `, [config.id, config.key, config.value, config.description, config.isActive]);
    }
    
    console.log('Analytics configuration initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing analytics configuration:', error);
    process.exit(1);
  }
}

// Run the initialization
initAnalyticsConfig();