-- =====================================================================
-- Migration 003: Staff Permissions, Game Categories, Game Ordering
-- =====================================================================

USE gaming_hub;

-- Add permissions column to admin_users
ALTER TABLE admin_users
ADD COLUMN permissions JSON DEFAULT NULL COMMENT 'Staff permissions: {manage_stations, manage_games, manage_prices}';

-- Add category and display order to games
ALTER TABLE games
ADD COLUMN category VARCHAR(60) DEFAULT 'Uncategorized' AFTER console_type,
ADD COLUMN display_order INT DEFAULT 0 AFTER category,
ADD INDEX idx_games_category_order (category, display_order);

-- Add description to games for edit functionality
ALTER TABLE games
ADD COLUMN description TEXT DEFAULT NULL AFTER image_url;

-- Update existing games with default categories
UPDATE games SET category = 'Sports' WHERE title IN ('FC26', 'GT7');
UPDATE games SET category = 'Strategy' WHERE title IN ('Age of Empires', 'Port Royale 4');
UPDATE games SET category = 'Casual' WHERE title = 'Balatro';
UPDATE games SET category = 'Simulation' WHERE title IN ('Flight Simulator', 'Mechanic Simulator', 'Medical Surgery Simulator', 'Hacknet');

-- Set initial display order
UPDATE games SET display_order = 1 WHERE title = 'FC26';
UPDATE games SET display_order = 2 WHERE title = 'GT7';
UPDATE games SET display_order = 3 WHERE title = 'Age of Empires';
UPDATE games SET display_order = 4 WHERE title = 'Port Royale 4';
UPDATE games SET display_order = 5 WHERE title = 'Balatro';
UPDATE games SET display_order = 6 WHERE title = 'Flight Simulator';
UPDATE games SET display_order = 7 WHERE title = 'Mechanic Simulator';
UPDATE games SET display_order = 8 WHERE title = 'Medical Surgery Simulator';
UPDATE games SET display_order = 9 WHERE title = 'Hacknet';

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id INT UNSIGNED NOT NULL,
    token CHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_reset_token (token),
    CONSTRAINT fk_reset_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add last password change tracking
ALTER TABLE admin_users
ADD COLUMN last_password_change DATETIME DEFAULT NULL AFTER password_hash;
