-- =====================================================================
-- Migration: rename console type 'PS5' -> 'PS5 Pro'
-- Run this ONLY if you already imported the original schema.sql before
-- this update. A fresh `mysql -u root < schema.sql` already uses 'PS5 Pro'.
-- =====================================================================
USE gaming_hub;

-- Step 1: widen the enum so both old and new values are valid during the transition
ALTER TABLE games
  MODIFY COLUMN console_type ENUM('PS5','PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other';
ALTER TABLE stations
  MODIFY COLUMN console_type ENUM('PS5','PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other';

-- Step 2: migrate the data
UPDATE games    SET console_type = 'PS5 Pro' WHERE console_type = 'PS5';
UPDATE stations SET console_type = 'PS5 Pro' WHERE console_type = 'PS5';

-- Step 3: narrow the enum back down now that no row uses the old value
ALTER TABLE games
  MODIFY COLUMN console_type ENUM('PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other';
ALTER TABLE stations
  MODIFY COLUMN console_type ENUM('PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other';
