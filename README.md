# ITeMS Gaming Hub — Ticket & Booking Application

A full-stack booking system for a gaming lounge: customers book a station/game
online and get an instant ticket; staff check people in/out on a live
dashboard with countdown timers; a Super Admin controls pricing, extra
charges, the game catalogue, staff accounts, and revenue.

Stack: **React** (frontend) · **PHP (PDO/MySQLi)** (backend REST API) ·
**MySQL** via **XAMPP/Apache**.

This has been syntax-checked (`php -l` on every file) and smoke-tested
end-to-end against a live MySQL instance (booking creation, the double-booking
conflict check, check-in/check-out, extra charges, transactions, and
role-gated Super Admin endpoints all verified working).

---

## 1. Backend setup (XAMPP)

1. Start **Apache** and **MySQL** from the XAMPP control panel.
2. Copy the `backend` folder into your XAMPP `htdocs` directory, e.g.:
   ```
   C:\xampp\htdocs\gaming-hub\backend      (Windows)
   /Applications/XAMPP/htdocs/gaming-hub/backend   (macOS)
   ```
3. Import the schema: open **phpMyAdmin** → *Import* → select
   `backend/schema.sql`. This creates the `gaming_hub` database, all tables,
   and seed data (5 games, 6 stations, 3 charge types, and one Super Admin).
4. Check `backend/config/database.php` — the defaults (`root` / empty
   password / `127.0.0.1:3306`) match a stock XAMPP install. Update if yours
   differs.
5. Confirm the API is live by visiting:
   `http://localhost/gaming-hub/backend/api/games.php`
   You should see a JSON list of games.

**Default Super Admin login:**
- Username: `superadmin`
- Password: `ChangeMe123!`

⚠️ Change this password immediately after first login (Super Admin → Staff →
edit the account with a new password), or update the seed row directly.

**Staff/Super Admin sign-in is at `/login`** — it's intentionally not linked
from the public landing page, so staff need to navigate there directly (e.g.
`http://localhost:3000/login`). Bookmark it for your team.

### API routing
Every endpoint also works directly as a `.php` file with `?id=` query
params (e.g. `PUT /api/admin/bookings_status.php?id=12`), which needs no
special Apache config. An optional `backend/api/.htaccess` is included for
prettier URLs (`/api/admin/bookings/12/status`) if `mod_rewrite` is enabled.

---

## 2. Frontend setup (React)

```bash
cd frontend
npm install
```

Create `frontend/.env` and point it at your backend:
```
REACT_APP_API_URL=http://localhost/gaming-hub/backend/api
```

Run it:
```bash
npm start
```
Opens at `http://localhost:3000`.

> The backend's CORS config (`backend/bootstrap.php`) already allows
> `localhost:3000` and `localhost:5173`. Add any other dev origin there.

---

## 3. What's included

### Database (`backend/schema.sql`)
`games`, `stations`, `bookings`, `booking_charges`, `charge_types`,
`leaderboard`, `admin_users`, `admin_sessions`, `transactions` — with proper
foreign keys, enums for status fields, and indexes on the columns the
conflict-check and dashboard queries filter on.

### REST API (`backend/api`)
| Method | Endpoint | Access |
|---|---|---|
| GET | `/games.php` | Public |
| GET | `/stations.php?console_type=PS5 Pro` | Public |
| GET | `/leaderboard.php` | Public |
| POST | `/bookings.php` | Public — creates a ticket, rejects overlapping station/time slots |
| GET | `/bookings.php?ticket=GHK-XXXXXX` | Public — ticket lookup |
| POST | `/bookings_cancel.php` | Public — self-service cancel, verified by ticket + phone match |
| POST | `/admin/auth.php` | Public — login, returns bearer token |
| GET | `/admin/dashboard.php` | Staff — live stations, countdowns, pending tickets, stats |
| GET | `/admin/bookings.php` | Staff — searchable/paginated bookings table |
| PUT | `/admin/bookings_status.php?id=` | Staff — Confirm / Check-In / Complete / Cancel |
| POST | `/admin/apply_charge.php` | Staff — bill an extra charge onto a ticket |
| POST | `/admin/leaderboard_submit.php` | Staff — logs a completed session's score/win to the leaderboard |
| POST/PUT/DELETE | `/admin/games_manage.php` | **Super Admin** — catalogue + pricing |
| POST/PUT/DELETE | `/admin/stations_manage.php` | **Super Admin** |
| GET/POST/PUT/DELETE | `/admin/charges_manage.php` | **Super Admin** — extra fee types |
| GET/POST/PUT/DELETE | `/admin/staff_manage.php` | **Super Admin** — staff accounts |
| GET | `/admin/transactions.php` | **Super Admin** — revenue/payments |

Every write endpoint validates input (`helpers/Validator.php`), and the
booking + status-update endpoints wrap their logic in a DB transaction with
row locking (`SELECT ... FOR UPDATE`) so two people booking the same slot at
the same instant can't both succeed.

### Frontend (`frontend/src`)
- `pages/LandingPage.jsx` — game cards, dynamic leaderboard, hub contact info
- `pages/BookingPage.jsx` — booking form + ticket confirmation screen
- `pages/AdminDashboard.jsx` — live station grid with countdown rings + searchable bookings table
- `pages/SuperAdminDashboard.jsx` — tabs for Games, Charges, Staff, Transactions
- `api/api.js` — single fetch client, all endpoints in one place
- `styles/theme.css` — the whole design system (colors, type, components) as CSS variables

## 4. Cancellations, notifications & real leaderboard scoring

**Cancellations** — customers can self-cancel a Pending/Confirmed booking at
`/manage` (ticket ID + phone number verification, no login needed). Staff can
also cancel from the admin bookings table. Once a session is checked in
(Active) or finished, it can no longer be self-cancelled online.

**Email & SMS confirmations** — sent automatically on booking and on
cancellation, but **disabled by default** so a fresh install never breaks
because SMTP/SMS isn't configured yet:
- Turn email on in `backend/config/notifications.php` → `email.enabled = true`
  and fill in your SMTP host/port/credentials. No Composer/PHPMailer install
  needed — it uses a small built-in SMTP client (`helpers/SmtpMailer.php`)
  that's been tested against plaintext, STARTTLS, and AUTH LOGIN flows.
- Turn SMS on the same way under `sms.enabled = true` with a Termii API key
  (swap the provider in `helpers/Notifier.php::sendViaTermii()` if you use
  Twilio/Africa's Talking instead).
- Both are best-effort: a failed send is logged via `error_log()` and never
  blocks the booking itself.
- The booking form now has an optional email field; phone number is always
  used for SMS + as the cancellation identity check.

**Real leaderboard scoring** — after staff mark a session **Completed**, a
"Log Session Result" prompt appears where they enter the player's score and
whether they won. This calls `POST /admin/leaderboard_submit.php`, which
upserts into `leaderboard` (score and wins accumulate per player+game via
`ON DUPLICATE KEY UPDATE`) — so the public leaderboard is now driven by
actual completed sessions instead of static seed data.

If you already ran the original `schema.sql`, apply
`backend/migrations/001_cancellations_notifications_leaderboard.sql` to add
the new `customer_email` column and leaderboard unique key. A fresh
`schema.sql` import already includes both.

## 5. Branding, catalogue & background video

- **Games** — seeded catalogue: PS5 Pro (FC26, GT7, Age of Empires, Port
  Royale 4, Balatro) and PC (Flight Simulator, Mechanic Simulator, Medical
  Surgery Simulator, Hacknet). Add/remove titles anytime from Super Admin →
  Games. If you already had the old seed data installed, run
  `backend/migrations/002_rename_ps5_to_ps5_pro.sql` to rename the console
  type on existing rows (a fresh `schema.sql` import already uses `PS5 Pro`).
- **Background video** — `frontend/src/components/VideoBackground.jsx` renders
  a fixed, full-viewport looping video behind every page (mounted once in
  `App.jsx`, so it doesn't reload on navigation). It uses free, no-attribution
  Mixkit stock gaming footage by default — swap the `<source src="...">` URL
  for your own clip anytime; keep the dark gradient overlay (or adjust its
  opacity) so text stays legible on top.

## 6. Suggested next steps
- Swap the bearer-token store from `localStorage` to an httpOnly cookie for production.
- Add rate limiting on `/admin/auth.php` and `/bookings_cancel.php`.
- Add a `.env`-driven `BASE_URL` build step for deploying frontend + backend on different domains (CORS is already set up for this).
