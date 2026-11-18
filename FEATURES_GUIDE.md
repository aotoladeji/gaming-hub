# Gaming Hub - New Features Guide

## 🚀 Quick Start

### 1. Run Database Migration
```sql
-- In phpMyAdmin or MySQL command line:
mysql -u root -p gaming_hub < backend/migrations/003_permissions_categories_ordering.sql
```

### 2. Start the Application
```bash
# Backend (XAMPP/Apache should be running)
# Frontend
cd frontend
npm start
```

## 📋 Feature Overview

### 1. **Separated Staff and Super Admin Dashboards**

**Staff Dashboard** (`/admin/dashboard`)
- View live stations and manage bookings
- Check-in and check-out customers
- View booking details by clicking ticket numbers
- Access based on permissions

**Super Admin Dashboard** (`/admin/super`)
- Full access to all features
- Manage games, stations, staff, and charges
- View analytics and reports
- Set staff permissions

**No more switching buttons!** Each role has its own dedicated page.

---

### 2. **Password Management**

All users can now change their passwords:

1. Click the **Settings** icon in the top right corner
2. Select **Change Password** from the dropdown
3. Enter current password and new password
4. Confirm the change

**Location**: `/admin/change-password`

---

### 3. **Game Categories with View All**

Games are now organized by categories on the landing page:

- **Sports**: FC26, GT7
- **Strategy**: Age of Empires, Port Royale 4
- **Simulation**: Flight Simulator, Mechanic Simulator, etc.
- **Casual**: Balatro

**Features**:
- Each category shows game count
- Toggle "View All" / "Show Less" for each category
- Collapsed view shows first 4 games
- Expanded view shows all games in category

---

### 4. **Full Transaction Details Modal**

Click any **ticket number** in the bookings table to see:

- Customer information (name, phone, email)
- Session details (game, station, console, time slot)
- Live countdown timer for active sessions
- Complete pricing breakdown (base price + extra charges)
- Payment history with timestamps
- Staff who recorded transactions

**Visual Features**:
- Color-coded status badges
- Live countdown timer for active sessions
- Overtime warnings in red
- Complete audit trail

---

### 5. **Staff Permissions System**

Super Admin can now assign granular permissions to staff:

**Permission Types**:
- ✅ **Manage Stations** - Add, edit, delete stations
- ✅ **Manage Games** - Add, edit, delete games
- ✅ **Manage Prices** - Edit game prices

**How to Set Permissions**:
1. Go to Super Admin Dashboard → Staff tab
2. When creating/editing staff, select their permissions
3. Staff will only see features they have access to

**Backend Protection**: All API endpoints validate permissions.

---

### 6. **Enhanced Game Management**

**New Fields**:
- **Category**: Organize games (Sports, Strategy, Simulation, etc.)
- **Description**: Detailed game information
- **Display Order**: Control the order games appear

**Features for Staff/Admin**:
- Edit game details inline
- Change prices quickly
- Assign categories
- Reorder games (API ready, UI coming soon)

---

### 7. **Analytics Dashboard** (Super Admin Only)

Comprehensive analytics available via API:

**Metrics**:
- 📊 Most played games (by booking count)
- 💰 Revenue trends (last 7 days)
- 👥 Top customers (by total spend)
- 🎮 Station utilization (by total hours)
- 📈 Console type popularity
- 📊 Category popularity
- 📋 Booking status breakdown

**API Endpoint**: `GET /api/admin/analytics.php`

*(Visual charts coming in next update)*

---

### 8. **Updated Video Background**

- New video from: https://www.youtube.com/watch?v=pmzfmoe7Jmw
- Lighter overlay for better text visibility
- Auto-plays and loops seamlessly
- No controls visible

---

## 🔐 User Roles & Access

### Super Admin
- ✅ Full system access
- ✅ View analytics
- ✅ Manage staff accounts and permissions
- ✅ Manage games, stations, charges
- ✅ View all bookings and transactions
- ✅ Access both dashboards

### Staff (with permissions)
- ✅ Manage bookings (check-in, check-out)
- ✅ View live stations
- ✅ Log scores to leaderboard
- ✅ Apply extra charges
- ⚠️ Limited by assigned permissions for:
  - Managing stations
  - Managing games
  - Editing prices

### Staff (without permissions)
- ✅ View-only access to stations and games
- ✅ Manage bookings only

---

## 📱 User Interface Improvements

### Navigation Bar with Dropdown
- Settings icon in top right
- Dropdown menu with:
  - Change Password
  - Sign Out (in red)
- Shows user name and role
- Quick link to Super Admin dashboard (if applicable)

### Booking Table Enhancements
- Click ticket numbers to view details
- Color-coded status badges
- View button for full details
- Better responsive layout

### Landing Page
- Categorized game sections
- Collapsible categories
- Better game discovery
- Shows available slots per game

---

## 🛠️ Technical Details

### New API Endpoints

```
GET    /api/admin/profile.php              - Get current user profile
PUT    /api/admin/profile.php              - Update profile
POST   /api/admin/profile.php              - Change password
GET    /api/admin/analytics.php            - Get analytics (super admin)
GET    /api/admin/booking_details.php?id=X - Get booking details
PATCH  /api/admin/games_manage.php         - Reorder games (bulk)
```

### Updated API Endpoints

```
GET    /api/games.php                      - Now returns categorized games
POST   /api/admin/games_manage.php         - Supports categories
POST   /api/admin/staff_manage.php         - Supports permissions
```

### Database Changes

**New Columns**:
- `admin_users.permissions` (JSON) - Staff permissions
- `admin_users.last_password_change` (DATETIME) - Password change tracking
- `games.category` (VARCHAR) - Game category
- `games.display_order` (INT) - Custom ordering
- `games.description` (TEXT) - Game description

**New Table**:
- `password_reset_tokens` - For future password reset functionality

---

## 🔜 Coming Soon

1. **Visual Analytics Dashboard**
   - Charts and graphs for data visualization
   - Interactive reports

2. **Auto Check-In Feature**
   - Automatically start sessions at scheduled time
   - No manual check-in required for on-time arrivals

3. **Drag & Drop Game Reordering**
   - Visual interface for reordering games
   - Changes reflected immediately

4. **Game Edit Modal**
   - Rich editor for game details
   - Image upload support

5. **Session End Protection**
   - Confirmation dialog before ending sessions
   - Prevent accidental completions

---

## 🐛 Known Issues & Limitations

1. **Auto Check-In**: Requires cron job setup (not yet implemented)
2. **Analytics Visualization**: API ready, charts UI pending
3. **Game Reordering UI**: Backend ready, drag-drop UI pending
4. **Password Reset**: Table exists, but email functionality not implemented

---

## 💡 Tips & Best Practices

### For Super Admins:
1. Assign minimal permissions needed for each staff member
2. Regularly review analytics to optimize station usage
3. Keep game categories organized for better user experience
4. Update game descriptions to help customers choose

### For Staff:
1. Always check-in customers on time to start their timer
2. Use the booking detail modal to review charges before checkout
3. Log scores to leaderboard after completed sessions
4. Apply extra charges before completing bookings

### For Developers:
1. Run migrations before testing new features
2. Check browser console for any errors
3. Test permissions thoroughly for staff accounts
4. Use the analytics API for custom reports

---

## 📞 Support

For issues or questions:
1. Check the `IMPLEMENTATION_SUMMARY.md` file
2. Review API endpoint documentation
3. Check browser console for errors
4. Verify database migrations have run

---

## 🎯 Quick Reference

| Feature | Access Level | Route |
|---------|-------------|-------|
| Staff Dashboard | Staff + Super Admin | `/admin/dashboard` |
| Super Admin Dashboard | Super Admin Only | `/admin/super` |
| Change Password | All Users | `/admin/change-password` |
| Landing Page | Public | `/` |
| Booking Details | Staff + Super Admin | Click ticket number |
| Analytics | Super Admin | API only (charts pending) |

---

**Version**: 2.0  
**Last Updated**: 2026-07-20  
**Author**: ITeMS Gaming Hub Development Team
