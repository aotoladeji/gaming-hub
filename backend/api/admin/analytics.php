<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/analytics
 * Requires: super_admin role
 * 
 * Returns analytics data:
 * - Games played the most
 * - Revenue trends (last 7 days)
 * - Top customers
 * - Station utilization
 * - Booking status breakdown
 */

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    Response::error('Method not allowed', 405);
}

$admin = Auth::requireAuth();
if ($admin['role'] !== 'super_admin') {
    Response::error('Super admin access required.', 403);
}

$db = Database::connect();

// Most played games
$mostPlayedStmt = $db->query(
    'SELECT g.id, g.title, g.console_type, g.category, COUNT(b.id) AS play_count, 
            SUM(b.total_price) AS total_revenue
     FROM games g
     LEFT JOIN bookings b ON b.game_id = g.id AND b.status IN ("Completed", "Active")
     GROUP BY g.id
     ORDER BY play_count DESC
     LIMIT 10'
);
$mostPlayed = $mostPlayedStmt->fetchAll();

// Revenue trend (last 7 days)
$revenueTrendStmt = $db->query(
    'SELECT DATE(created_at) AS date, SUM(total_price) AS revenue, COUNT(id) AS bookings
     FROM bookings
     WHERE status = "Completed" AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
     GROUP BY DATE(created_at)
     ORDER BY date ASC'
);
$revenueTrend = $revenueTrendStmt->fetchAll();

// Top customers (by total spend)
$topCustomersStmt = $db->query(
    'SELECT customer_name, customer_email, phone_number, 
            COUNT(id) AS total_bookings, SUM(total_price) AS total_spent
     FROM bookings
     WHERE status = "Completed"
     GROUP BY customer_name, customer_email, phone_number
     ORDER BY total_spent DESC
     LIMIT 10'
);
$topCustomers = $topCustomersStmt->fetchAll();

// Station utilization (percentage of time occupied)
$stationUtilizationStmt = $db->query(
    'SELECT s.id, s.name, s.console_type,
            COUNT(b.id) AS total_sessions,
            SUM(b.duration_hours) AS total_hours
     FROM stations s
     LEFT JOIN bookings b ON b.station_id = s.id AND b.status IN ("Completed", "Active")
     GROUP BY s.id
     ORDER BY total_hours DESC'
);
$stationUtilization = $stationUtilizationStmt->fetchAll();

// Booking status breakdown
$statusBreakdownStmt = $db->query(
    'SELECT status, COUNT(id) AS count, SUM(total_price) AS total_value
     FROM bookings
     GROUP BY status'
);
$statusBreakdown = $statusBreakdownStmt->fetchAll();

// Console type popularity
$consolePopularityStmt = $db->query(
    'SELECT g.console_type, COUNT(b.id) AS bookings, SUM(b.total_price) AS revenue
     FROM bookings b
     JOIN games g ON g.id = b.game_id
     WHERE b.status IN ("Completed", "Active")
     GROUP BY g.console_type
     ORDER BY bookings DESC'
);
$consolePopularity = $consolePopularityStmt->fetchAll();

// Category popularity
$categoryPopularityStmt = $db->query(
    'SELECT g.category, COUNT(b.id) AS bookings, SUM(b.total_price) AS revenue
     FROM bookings b
     JOIN games g ON g.id = b.game_id
     WHERE b.status IN ("Completed", "Active")
     GROUP BY g.category
     ORDER BY bookings DESC'
);
$categoryPopularity = $categoryPopularityStmt->fetchAll();

Response::ok([
    'most_played_games' => $mostPlayed,
    'revenue_trend' => $revenueTrend,
    'top_customers' => $topCustomers,
    'station_utilization' => $stationUtilization,
    'status_breakdown' => $statusBreakdown,
    'console_popularity' => $consolePopularity,
    'category_popularity' => $categoryPopularity,
]);
