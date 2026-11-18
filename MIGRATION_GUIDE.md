# Database Migration Guide

## ⚠️ Important: Run This First!

If you're seeing **"Server returned an invalid response"** when adding games or other features, you need to run the database migration.

---

## Method 1: Quick Check (Recommended)

1. Open your browser and go to:
   ```
   http://localhost/gaming-hub/backend/check_schema.php
   ```

2. This will show you which columns are missing

3. If migration is needed, follow Method 2 below

---

## Method 2: Run Migration via phpMyAdmin

### Step 1: Open phpMyAdmin
- Go to: `http://localhost/phpmyadmin`
- Login (usually no password for XAMPP)

### Step 2: Select Database
- Click on `gaming_hub` database in the left sidebar

### Step 3: Import Migration File
1. Click the **"Import"** tab at the top
2. Click **"Choose File"** button
3. Navigate to: `c:\xampp\htdocs\gaming-hub\backend\migrations\`
4. Select: `003_permissions_categories_ordering_safe.sql`
5. Click **"Go"** button at the bottom

### Step 4: Verify Success
- You should see a green success message
- Go back to `http://localhost/gaming-hub/backend/check_schema.php` to verify

---

## Method 3: Run via MySQL Command Line

```bash
mysql -u root -p gaming_hub < "c:\xampp\htdocs\gaming-hub\backend\migrations\003_permissions_categories_ordering_safe.sql"
```

*(Press Enter when asked for password if you don't have one set)*

---

## What This Migration Does

### Adds to `games` table:
- ✅ `category` - Game category (Sports, Strategy, etc.)
- ✅ `display_order` - Custom ordering for games
- ✅ `description` - Detailed game descriptions

### Adds to `admin_users` table:
- ✅ `permissions` - JSON column for staff permissions
- ✅ `last_password_change` - Tracks password changes

### Creates new table:
- ✅ `password_reset_tokens` - For future password reset feature

### Updates existing data:
- ✅ Assigns categories to existing games
- ✅ Sets display order for existing games

---

## Troubleshooting

### Error: "Table 'gaming_hub.games' doesn't exist"
- Make sure you've run the main schema.sql first
- Import: `backend/schema.sql` before running migrations

### Error: "Duplicate column name"
- The columns already exist! No action needed
- This is why we use the `_safe.sql` version

### Still getting "Server returned an invalid response"
1. Check browser console (F12) for detailed error
2. Check: `c:\xampp\apache\logs\error.log` for PHP errors
3. Verify Apache and MySQL are running in XAMPP Control Panel

### Can't access phpMyAdmin
- Make sure Apache and MySQL are running in XAMPP
- Try: `http://127.0.0.1/phpmyadmin` instead

---

## After Migration

Once migration is complete, you should be able to:

1. ✅ Add new games with categories
2. ✅ See categorized games on landing page
3. ✅ Set staff permissions
4. ✅ Change passwords
5. ✅ View booking details
6. ✅ Reorder games (API ready)

---

## Need Help?

1. Run the check script: `http://localhost/gaming-hub/backend/check_schema.php`
2. Check XAMPP error logs
3. Verify all columns exist in phpMyAdmin
4. Make sure you're using the `gaming_hub` database

---

## Quick Verification SQL

Run this in phpMyAdmin SQL tab to check if migration worked:

```sql
USE gaming_hub;

-- Check games table
SHOW COLUMNS FROM games LIKE 'category';
SHOW COLUMNS FROM games LIKE 'display_order';
SHOW COLUMNS FROM games LIKE 'description';

-- Check admin_users table
SHOW COLUMNS FROM admin_users LIKE 'permissions';

-- Should return 4 results if all migrations applied
```

---

**Note**: The `_safe.sql` version checks if columns exist before adding them, so it's safe to run multiple times.
