-- =====================================================================
-- Migration 003: Staff Permissions, Game Categories, Game Ordering
-- SAFE VERSION - Checks if columns exist before adding
-- =====================================================================

USE gaming_hub;

-- Check and add permissions column to admin_users
SET @dbname = DATABASE();
SET @tablename = 'admin_users';
SET @columnname = 'permissions';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_NAME = @tablename)
      AND (TABLE_SCHEMA = @dbname)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' JSON DEFAULT NULL COMMENT ''Staff permissions: {manage_stations, manage_games, manage_prices}''')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add category column to games
SET @tablename = 'games';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_NAME = @tablename)
      AND (TABLE_SCHEMA = @dbname)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(60) DEFAULT ''Uncategorized'' AFTER console_type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add display_order column to games
SET @columnname = 'display_order';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_NAME = @tablename)
      AND (TABLE_SCHEMA = @dbname)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' INT DEFAULT 0 AFTER category')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Check and add description column to games
SET @columnname = 'description';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_NAME = @tablename)
      AND (TABLE_SCHEMA = @dbname)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TEXT DEFAULT NULL AFTER image_url')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add index if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'games' 
               AND index_name = 'idx_games_category_order');

SET @sqlstmt := IF(@exist > 0, 'SELECT ''Index already exists''', 
                   'CREATE INDEX idx_games_category_order ON games (category, display_order)');

PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_password_change column to admin_users
SET @tablename = 'admin_users';
SET @columnname = 'last_password_change';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_NAME = @tablename)
      AND (TABLE_SCHEMA = @dbname)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATETIME DEFAULT NULL AFTER password_hash')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Create password_reset_tokens table if not exists
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    token CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reset_token (token),
    CONSTRAINT fk_reset_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Update existing games with default categories (only if category exists and is null/empty)
UPDATE games SET category = 'Sports' WHERE title IN ('FC26', 'GT7') AND (category IS NULL OR category = '');
UPDATE games SET category = 'Strategy' WHERE title IN ('Age of Empires', 'Port Royale 4') AND (category IS NULL OR category = '');
UPDATE games SET category = 'Casual' WHERE title = 'Balatro' AND (category IS NULL OR category = '');
UPDATE games SET category = 'Simulation' WHERE title IN ('Flight Simulator', 'Mechanic Simulator', 'Medical Surgery Simulator', 'Hacknet') AND (category IS NULL OR category = '');

-- Set initial display order (only if not already set)
UPDATE games SET display_order = 1 WHERE title = 'FC26' AND display_order = 0;
UPDATE games SET display_order = 2 WHERE title = 'GT7' AND display_order = 0;
UPDATE games SET display_order = 3 WHERE title = 'Age of Empires' AND display_order = 0;
UPDATE games SET display_order = 4 WHERE title = 'Port Royale 4' AND display_order = 0;
UPDATE games SET display_order = 5 WHERE title = 'Balatro' AND display_order = 0;
UPDATE games SET display_order = 6 WHERE title = 'Flight Simulator' AND display_order = 0;
UPDATE games SET display_order = 7 WHERE title = 'Mechanic Simulator' AND display_order = 0;
UPDATE games SET display_order = 8 WHERE title = 'Medical Surgery Simulator' AND display_order = 0;
UPDATE games SET display_order = 9 WHERE title = 'Hacknet' AND display_order = 0;

SELECT 'Migration 003 completed successfully!' AS status;
