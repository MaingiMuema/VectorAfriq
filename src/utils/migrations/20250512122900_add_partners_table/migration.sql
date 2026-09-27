-- Create partners table
CREATE TABLE IF NOT EXISTS partner (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(255) NOT NULL,
  logo TEXT NOT NULL,
  link VARCHAR(255) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add initial partners data from the hardcoded array
INSERT INTO partner (name, logo, link) VALUES
  ('WMP Properties', '/images/placeholder.png', '/partners/wmp'),
  ('Coral Property', '/images/placeholder.png', '/partners/coral'),
  ('Wemark Properties', '/images/placeholder.png', '/partners/wemark'),
  ('Mi Vida Homes', '/images/placeholder.png', '/partners/mivida'),
  ('Splendor Properties', '/images/placeholder.png', '/partners/splendor'),
  ('Splendour Real Estate', '/images/placeholder.png', '/partners/splendour');