/**
 * Central API client.
 * Points at the PHP backend running under XAMPP, e.g.:
 *   http://localhost/gaming-hub/backend/api
 * Update BASE_URL to match where you placed the `backend` folder in htdocs.
 */

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost/gaming-hub/backend/api';

function getToken() {
  return localStorage.getItem('gh_admin_token');
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new Error('Server returned an invalid response.');
  }

  if (!res.ok || !payload.success) {
    const err = new Error(payload.message || 'Request failed.');
    err.status = res.status;
    err.errors = payload.errors;
    throw err;
  }

  return payload.data;
}

export const api = {
  // ---- Public ----
  getGames: (all = false) => request(`/games.php${all ? '?all=1' : ''}`),
  getLeaderboard: (gameId) => request(`/leaderboard.php${gameId ? `?game_id=${gameId}` : ''}`),
  createBooking: (payload) => request('/bookings.php', { method: 'POST', body: payload }),
  getTicket: (ticketNumber) => request(`/bookings.php?ticket=${encodeURIComponent(ticketNumber)}`),
  cancelBooking: (ticketNumber, phoneNumber) =>
    request('/bookings_cancel.php', { method: 'POST', body: { ticket_number: ticketNumber, phone_number: phoneNumber } }),
  getStations: (consoleType) => request(`/stations.php${consoleType ? `?console_type=${encodeURIComponent(consoleType)}` : ''}`),

  // ---- Admin auth ----
  login: (username, password) => request('/admin/auth.php', { method: 'POST', body: { username, password } }),

  // ---- Admin profile ----
  getProfile: () => request('/admin/profile.php', { auth: true }),
  updateProfile: (payload) => request('/admin/profile.php', { method: 'PUT', body: payload, auth: true }),
  changePassword: (currentPassword, newPassword) =>
    request('/admin/profile.php', { method: 'POST', body: { current_password: currentPassword, new_password: newPassword }, auth: true }),

  // ---- Admin (staff) ----
  getDashboard: () => request('/admin/dashboard.php', { auth: true }),
  getAdminBookings: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/bookings.php${qs ? `?${qs}` : ''}`, { auth: true });
  },
  getBookingDetails: (id) => request(`/admin/booking_details.php?id=${id}`, { auth: true }),
  updateBookingStatus: (id, status, extra = {}) =>
    request(`/admin/bookings_status.php?id=${id}`, { method: 'PUT', body: { status, ...extra }, auth: true }),
  applyCharge: (bookingId, chargeTypeId, quantity) =>
    request('/admin/apply_charge.php', { method: 'POST', body: { booking_id: bookingId, charge_type_id: chargeTypeId, quantity }, auth: true }),
  submitScore: (bookingId, score, won, playerName) =>
    request('/admin/leaderboard_submit.php', { method: 'POST', body: { booking_id: bookingId, score, won, player_name: playerName }, auth: true }),

  // ---- Super Admin ----
  getAnalytics: () => request('/admin/analytics.php', { auth: true }),
  
  getChargeTypes: () => request('/admin/charges_manage.php', { auth: true }),
  createChargeType: (payload) => request('/admin/charges_manage.php', { method: 'POST', body: payload, auth: true }),
  updateChargeType: (id, payload) => request(`/admin/charges_manage.php?id=${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteChargeType: (id) => request(`/admin/charges_manage.php?id=${id}`, { method: 'DELETE', auth: true }),

  createGame: (payload) => request('/admin/games_manage.php', { method: 'POST', body: payload, auth: true }),
  updateGame: (id, payload) => request(`/admin/games_manage.php?id=${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteGame: (id) => request(`/admin/games_manage.php?id=${id}`, { method: 'DELETE', auth: true }),
  reorderGames: (games) => request('/admin/games_manage.php', { method: 'PATCH', body: { games }, auth: true }),

  createStation: (payload) => request('/admin/stations_manage.php', { method: 'POST', body: payload, auth: true }),
  updateStation: (id, payload) => request(`/admin/stations_manage.php?id=${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteStation: (id) => request(`/admin/stations_manage.php?id=${id}`, { method: 'DELETE', auth: true }),

  getStaff: () => request('/admin/staff_manage.php', { auth: true }),
  createStaff: (payload) => request('/admin/staff_manage.php', { method: 'POST', body: payload, auth: true }),
  updateStaff: (id, payload) => request(`/admin/staff_manage.php?id=${id}`, { method: 'PUT', body: payload, auth: true }),
  deleteStaff: (id) => request(`/admin/staff_manage.php?id=${id}`, { method: 'DELETE', auth: true }),

  getTransactions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/transactions.php${qs ? `?${qs}` : ''}`, { auth: true });
  },
};

export function saveSession(token, admin) {
  localStorage.setItem('gh_admin_token', token);
  localStorage.setItem('gh_admin', JSON.stringify(admin));
}

export function clearSession() {
  localStorage.removeItem('gh_admin_token');
  localStorage.removeItem('gh_admin');
}

export function getSession() {
  const token = getToken();
  const adminRaw = localStorage.getItem('gh_admin');
  if (!token || !adminRaw) return null;
  try {
    return { token, admin: JSON.parse(adminRaw) };
  } catch {
    return null;
  }
}
