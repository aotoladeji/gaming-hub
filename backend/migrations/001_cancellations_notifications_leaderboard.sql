-- =====================================================================
-- Migration: cancellations, notifications, real leaderboard scoring
-- Run this ONLY if you already imported the original schema.sql before
-- this update. A fresh `mysql -u root < schema.sql` already includes these.
-- =====================================================================
USE gaming_hub;

ALTER TABLE bookings
  ADD COLUMN customer_email VARCHAR(150) DEFAULT NULL AFTER phone_number;

ALTER TABLE leaderboard
  ADD UNIQUE KEY uq_leaderboard_player_game (player_name, game_id);
