<?php
require_once __DIR__ . '/../../bootstrap.php';

/**
 * GET /api/admin/profile - Get current admin profile
 * PUT /api/admin/profile - Update profile (full name, username)
 * POST /api/admin/profile/change-password - Change password
 */

$admin = Auth::requireAuth();
$db = Database::connect();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get profile
    $stmt = $db->prepare('SELECT id, full_name, username, role, status, created_at, last_password_change FROM admin_users WHERE id = :id');
    $stmt->execute(['id' => $admin['id']]);
    $profile = $stmt->fetch();
    
    Response::ok($profile);
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    // Update profile
    $input = requestBody();
    $validator = new Validator($input, [
        'full_name' => 'string|max:120',
        'username' => 'string|max:60',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());
    
    try {
        $updates = [];
        $params = ['id' => $admin['id']];
        
        if (isset($input['full_name'])) {
            $updates[] = 'full_name = :full_name';
            $params['full_name'] = $input['full_name'];
        }
        
        if (isset($input['username'])) {
            // Check if username is already taken
            $checkStmt = $db->prepare('SELECT id FROM admin_users WHERE username = :username AND id != :id');
            $checkStmt->execute(['username' => $input['username'], 'id' => $admin['id']]);
            if ($checkStmt->fetch()) {
                Response::error('Username already taken.', 409);
            }
            $updates[] = 'username = :username';
            $params['username'] = $input['username'];
        }
        
        if (empty($updates)) {
            Response::error('No fields to update.', 400);
        }
        
        $sql = 'UPDATE admin_users SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $db->prepare($sql)->execute($params);
        
        Response::ok(null, 'Profile updated successfully.');
    } catch (Throwable $e) {
        Response::error('Failed to update profile.', 500, ['exception' => $e->getMessage()]);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Change password
    $input = requestBody();
    $validator = new Validator($input, [
        'current_password' => 'required|string',
        'new_password' => 'required|string|min:8',
    ]);
    if ($validator->fails()) Response::validationError($validator->errors());
    
    try {
        // Verify current password
        $stmt = $db->prepare('SELECT password_hash FROM admin_users WHERE id = :id');
        $stmt->execute(['id' => $admin['id']]);
        $user = $stmt->fetch();
        
        if (!password_verify($input['current_password'], $user['password_hash'])) {
            Response::error('Current password is incorrect.', 401);
        }
        
        // Update password
        $newHash = password_hash($input['new_password'], PASSWORD_BCRYPT);
        $db->prepare('UPDATE admin_users SET password_hash = :hash, last_password_change = NOW() WHERE id = :id')
           ->execute(['hash' => $newHash, 'id' => $admin['id']]);
        
        Response::ok(null, 'Password changed successfully.');
    } catch (Throwable $e) {
        Response::error('Failed to change password.', 500, ['exception' => $e->getMessage()]);
    }
}

Response::error('Method not allowed', 405);
