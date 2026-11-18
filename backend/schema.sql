-- =====================================================================
-- Gaming Hub Ticket & Booking Application — Database Schema
-- Target: MySQL 5.7+/8.0 (XAMPP)
-- Import via phpMyAdmin or: mysql -u root -p < schema.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS gaming_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gaming_hub;

-- ---------------------------------------------------------------------
-- Games catalogue
-- ---------------------------------------------------------------------
CREATE TABLE games (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title             VARCHAR(120) NOT NULL,
    image_url         VARCHAR(500) DEFAULT NULL,
    console_type      ENUM('PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other',
    price_per_hour    DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status            ENUM('available','unavailable') NOT NULL DEFAULT 'available',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_games_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Physical gaming stations / consoles on the floor
-- ---------------------------------------------------------------------
CREATE TABLE stations (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(100) NOT NULL,                      -- e.g. "PS5 Pro Station 1"
    console_type      ENUM('PS5 Pro','PS4','Xbox Series X','Xbox One','PC','Nintendo Switch','Other') NOT NULL DEFAULT 'Other',
    status            ENUM('idle','occupied','maintenance','offline') NOT NULL DEFAULT 'idle',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_station_name (name)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Admin / staff users (Super Admin can manage everything)
-- ---------------------------------------------------------------------
CREATE TABLE admin_users (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name         VARCHAR(120) NOT NULL,
    username          VARCHAR(60) NOT NULL,
    password_hash     VARCHAR(255) NOT NULL,
    role              ENUM('staff','super_admin') NOT NULL DEFAULT 'staff',
    status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_username (username)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Admin auth sessions (simple bearer-token auth, no external JWT lib needed)
-- ---------------------------------------------------------------------
CREATE TABLE admin_sessions (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    admin_id          INT UNSIGNED NOT NULL,
    token             CHAR(64) NOT NULL,
    expires_at        DATETIME NOT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_token (token),
    CONSTRAINT fk_session_admin FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Extra chargeable features defined by Super Admin
-- e.g. "Extra time in game room" (per_hour), "Controller rental" (flat)
-- ---------------------------------------------------------------------
CREATE TABLE charge_types (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name              VARCHAR(120) NOT NULL,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    unit              ENUM('flat','per_hour') NOT NULL DEFAULT 'flat',
    status            ENUM('active','inactive') NOT NULL DEFAULT 'active',
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Bookings / Tickets
-- ---------------------------------------------------------------------
CREATE TABLE bookings (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number     VARCHAR(20) NOT NULL,                       -- e.g. GHK-7F3K9A
    customer_name     VARCHAR(120) NOT NULL,
    phone_number      VARCHAR(20) NOT NULL,
    customer_email    VARCHAR(150) DEFAULT NULL,
    station_id        INT UNSIGNED NOT NULL,
    game_id           INT UNSIGNED NOT NULL,
    booking_date      DATE NOT NULL,
    start_time        TIME NOT NULL,
    end_time          TIME NOT NULL,
    duration_hours    DECIMAL(4,2) NOT NULL,
    base_price        DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    extra_charges     DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status            ENUM('Pending','Confirmed','Active','Completed','Cancelled') NOT NULL DEFAULT 'Pending',
    actual_start_at   DATETIME DEFAULT NULL,                      -- set at check-in (drives live countdown)
    actual_end_at     DATETIME DEFAULT NULL,                      -- set at check-out
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_ticket_number (ticket_number),
    KEY idx_station_date (station_id, booking_date),
    KEY idx_status (status),
    CONSTRAINT fk_booking_station FOREIGN KEY (station_id) REFERENCES stations(id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Extra charges applied to a specific booking (many-to-many w/ quantity)
CREATE TABLE booking_charges (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id        INT UNSIGNED NOT NULL,
    charge_type_id    INT UNSIGNED NOT NULL,
    quantity          DECIMAL(6,2) NOT NULL DEFAULT 1.00,
    amount            DECIMAL(10,2) NOT NULL DEFAULT 0.00,        -- snapshot of price at time of charge
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bc_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_bc_charge_type FOREIGN KEY (charge_type_id) REFERENCES charge_types(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Transactions (payments recorded against bookings)
-- ---------------------------------------------------------------------
CREATE TABLE transactions (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id        INT UNSIGNED NOT NULL,
    amount            DECIMAL(10,2) NOT NULL,
    payment_method    ENUM('cash','card','transfer','wallet') NOT NULL DEFAULT 'cash',
    recorded_by       INT UNSIGNED DEFAULT NULL,
    paid_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tx_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_tx_staff FOREIGN KEY (recorded_by) REFERENCES admin_users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Leaderboard
-- ---------------------------------------------------------------------
CREATE TABLE leaderboard (
    id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    player_name       VARCHAR(120) NOT NULL,
    game_id           INT UNSIGNED NOT NULL,
    score             INT NOT NULL DEFAULT 0,
    wins              INT NOT NULL DEFAULT 0,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lb_game FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
    UNIQUE KEY uq_leaderboard_player_game (player_name, game_id),
    KEY idx_lb_game_score (game_id, score DESC)
) ENGINE=InnoDB;

-- =====================================================================
-- Seed data
-- =====================================================================
INSERT INTO games (title, image_url, console_type, price_per_hour, status) VALUES
('FC26',                    'https://picsum.photos/seed/fc26/400/240',        'PS5 Pro', 1500.00, 'available'),
('GT7',                     'https://picsum.photos/seed/gt7/400/240',         'PS5 Pro', 1500.00, 'available'),
('Age of Empires',          'https://picsum.photos/seed/aoe/400/240',         'PS5 Pro', 1200.00, 'available'),
('Port Royale 4',           'https://picsum.photos/seed/portroyale/400/240',  'PS5 Pro', 1200.00, 'available'),
('Balatro',                 'https://picsum.photos/seed/balatro/400/240',     'PS5 Pro', 1000.00, 'available'),
('Flight Simulator',        'https://picsum.photos/seed/flightsim/400/240',   'PC', 1800.00, 'available'),
('Mechanic Simulator',      'https://picsum.photos/seed/mechsim/400/240',     'PC', 1200.00, 'available'),
('Medical Surgery Simulator','https://picsum.photos/seed/medsim/400/240',     'PC', 1200.00, 'available'),
('Hacknet',                 'https://picsum.photos/seed/hacknet/400/240',     'PC', 1000.00, 'available');

INSERT INTO stations (name, console_type, status) VALUES
('PS5 Pro Station 1', 'PS5 Pro', 'idle'),
('PS5 Pro Station 2', 'PS5 Pro', 'idle'),
('PS5 Pro Station 3', 'PS5 Pro', 'idle'),
('PC Station 1', 'PC', 'idle'),
('PC Station 2', 'PC', 'idle'),
('PC Station 3', 'PC', 'idle');

INSERT INTO charge_types (name, amount, unit, status) VALUES
('Extra time in game room', 500.00, 'per_hour', 'active'),
('Extra controller rental', 300.00, 'flat', 'active'),
('Snacks & drinks combo', 800.00, 'flat', 'active');

-- Default super admin (username: superadmin / password: ChangeMe123!)
-- Hash generated with PHP password_hash('ChangeMe123!', PASSWORD_BCRYPT)
INSERT INTO admin_users (full_name, username, password_hash, role, status) VALUES
('Hub Super Admin', 'superadmin', '$2b$10$gnOKf/mKEQOVelZrdG73kuN6AmOmIPl9ECMS8jicpEdGFrPPIi/1m', 'super_admin', 'active');

INSERT INTO leaderboard (player_name, game_id, score, wins) VALUES
('KingSlayer', 1, 2450, 18),
('NovaStrike',  2, 2210, 15),
('PixelQueen',  1, 1980, 12);
