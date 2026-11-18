import React, { useEffect, useState, useCallback } from 'react';
import { api, getSession } from '../api/api';
import AdminNav from '../components/AdminNav';
import StationGrid from '../components/StationGrid';
import BookingsTable from '../components/BookingsTable';
import BookingDetailModal from '../components/BookingDetailModal';
import LogScoreModal from '../components/LogScoreModal';
import GameEditModal from '../components/GameEditModal';

const REFRESH_MS = 10000;

export default function StaffDashboard() {
  const session = getSession();

  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [scoreModalBooking, setScoreModalBooking] = useState(null);
  const [detailBookingId, setDetailBookingId] = useState(null);
  
  // Games management
  const [showGames, setShowGames] = useState(false);
  const [games, setGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);
  
  // Stations management
  const [showStations, setShowStations] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [stationForm, setStationForm] = useState({ name: '', console_type: 'PS5 Pro', status: 'idle' });

  // Extra charges
  const [chargeTypes, setChargeTypes] = useState([]);
  const [applyingChargeFor, setApplyingChargeFor] = useState(null);
  const [chargeForm, setChargeForm] = useState({ charge_type_id: '', quantity: 1 });

  const loadDashboard = useCallback(() => {
    api.getDashboard().then((d) => { setStations(d.stations); setStats(d.stats); }).catch(() => {});
  }, []);

  const loadBookings = useCallback(() => {
    api.getAdminBookings(search ? { search } : {}).then((d) => setBookings(d.bookings)).catch(() => {});
  }, [search]);

  const loadGames = useCallback(() => {
    api.getGames(true).then((data) => setGames(data.games || [])).catch(() => {});
  }, []);

  const loadAllStations = useCallback(() => {
    api.getStations().then(setAllStations).catch(() => {});
  }, []);

  const loadChargeTypes = useCallback(() => {
    api.getChargeTypes().then(setChargeTypes).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
    loadBookings();
    loadChargeTypes();
    if (showGames) loadGames();
    if (showStations) loadAllStations();
    const interval = setInterval(loadDashboard, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadDashboard, loadBookings, loadGames, loadAllStations, loadChargeTypes, showGames, showStations]);

  useEffect(() => {
    const t = setTimeout(loadBookings, 300);
    return () => clearTimeout(t);
  }, [search, loadBookings]);

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  async function handleConfirm(id) {
    await api.updateBookingStatus(id, 'Confirmed');
    notify('Booking confirmed.');
    loadBookings(); loadDashboard();
  }
  
  async function handleCheckIn(id) {
    await api.updateBookingStatus(id, 'Active');
    notify('Checked in. Timer started.');
    loadBookings(); loadDashboard();
  }
  
  async function handleCheckout(id) {
    if (!window.confirm('Are you sure you want to end this session? This action cannot be undone.')) {
      return;
    }
    const bookingBeforeCheckout = bookings.find((b) => b.id === id);
    await api.updateBookingStatus(id, 'Completed', { payment_method: 'cash' });
    notify('Session completed and payment recorded.');
    loadBookings(); loadDashboard();
    if (bookingBeforeCheckout) setScoreModalBooking(bookingBeforeCheckout);
  }
  
  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking?')) return;
    await api.updateBookingStatus(id, 'Cancelled');
    notify('Booking cancelled.');
    loadBookings(); loadDashboard();
  }
  
  async function handleScoreSubmit({ playerName, score, won }) {
    await api.submitScore(scoreModalBooking.id, score, won, playerName);
    notify('Score logged to leaderboard.');
    setScoreModalBooking(null);
  }

  async function handleGameEdit(id, updates) {
    await api.updateGame(id, updates);
    notify('Game updated successfully.');
    loadGames();
  }

  async function toggleGameStatus(g) {
    await api.updateGame(g.id, { status: g.status === 'available' ? 'unavailable' : 'available' });
    loadGames();
  }

  async function deleteGame(id) {
    if (!window.confirm('Delete this game?')) return;
    try {
      await api.deleteGame(id);
      notify('Game deleted.');
      loadGames();
    } catch (err) {
      alert(err.message);
    }
  }

  async function addStation(e) {
    e.preventDefault();
    try {
      await api.createStation(stationForm);
      setStationForm({ name: '', console_type: 'PS5 Pro', status: 'idle' });
      notify('Station added successfully.');
      loadAllStations();
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteStation(id) {
    if (!window.confirm('Delete this station?')) return;
    try {
      await api.deleteStation(id);
      notify('Station deleted.');
      loadAllStations();
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function toggleStationStatus(station) {
    const newStatus = station.status === 'idle' ? 'maintenance' : 'idle';
    try {
      await api.updateStation(station.id, { status: newStatus });
      notify('Station status updated.');
      loadAllStations();
      loadDashboard();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleApplyCharge(e) {
    e.preventDefault();
    try {
      await api.applyCharge(applyingChargeFor, chargeForm.charge_type_id, chargeForm.quantity);
      notify('Extra charge applied successfully.');
      setApplyingChargeFor(null);
      setChargeForm({ charge_type_id: '', quantity: 1 });
      loadBookings();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="container" style={{ padding: '32px 24px 80px' }}>
      <AdminNav title="Staff Dashboard" showSuperAdminLink={false} />

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard label="Occupied Stations" value={`${stats.occupied_stations}/${stats.total_stations}`} />
          <StatCard label="Pending Tickets" value={stats.pending_tickets} />
          <StatCard label="Today's Bookings" value={stats.today_bookings} />
          <StatCard label="Today's Revenue" value={`₦${Number(stats.today_revenue).toLocaleString()}`} />
        </div>
      )}

      <h2 style={{ fontSize: 20, marginBottom: 14 }}>Live Stations</h2>
      <div style={{ marginBottom: 32 }}>
        <StationGrid stations={stations} onCheckout={handleCheckout} />
      </div>

      {/* Games Management Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, margin: 0 }}>Bookings</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowStations(!showStations)}
          >
            {showStations ? 'Hide Stations' : 'Manage Stations'}
          </button>
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => setShowGames(!showGames)}
          >
            {showGames ? 'Hide Games' : 'Manage Games'}
          </button>
        </div>
      </div>

      {showStations && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Stations Management</h3>
          
          <form onSubmit={addStation} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: 12, marginBottom: 20, alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: 12 }}>Station Name</label>
              <input
                value={stationForm.name}
                onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })}
                placeholder="e.g. PS5 Pro Station 4"
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Console Type</label>
              <select
                value={stationForm.console_type}
                onChange={(e) => setStationForm({ ...stationForm, console_type: e.target.value })}
              >
                {['PS5 Pro', 'PS4', 'Xbox Series X', 'Xbox One', 'PC', 'Nintendo Switch', 'Other'].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12 }}>Status</label>
              <select
                value={stationForm.status}
                onChange={(e) => setStationForm({ ...stationForm, status: e.target.value })}
              >
                <option value="idle">Idle</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>
            <div></div>
            <button type="submit" className="btn btn-primary btn-sm">Add Station</button>
          </form>

          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Console Type</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {allStations.map((station) => (
                <tr key={station.id}>
                  <td>{station.name}</td>
                  <td>{station.console_type}</td>
                  <td>
                    <span className={`badge ${
                      station.status === 'idle' ? 'badge-confirmed' :
                      station.status === 'occupied' ? 'badge-active' :
                      station.status === 'maintenance' ? 'badge-pending' : 'badge-cancelled'
                    }`}>
                      {station.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {station.status !== 'occupied' && (
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => toggleStationStatus(station)}
                      >
                        Toggle
                      </button>
                    )}
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => deleteStation(station.id)}
                      disabled={station.status === 'occupied'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGames && (
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Games Management</h3>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Console</th>
                <th>Category</th>
                <th>Price/hr</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {games.map((g) => (
                <tr key={g.id}>
                  <td>{g.title}</td>
                  <td>{g.console_type}</td>
                  <td>{g.category || 'Uncategorized'}</td>
                  <td className="mono">₦{Number(g.price_per_hour).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${g.status === 'available' ? 'badge-confirmed' : 'badge-cancelled'}`}>
                      {g.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditingGame(g)}>
                      Edit
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggleGameStatus(g)}>
                      Toggle
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteGame(g.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BookingsTable
        bookings={bookings}
        search={search}
        onSearchChange={setSearch}
        onConfirm={handleConfirm}
        onCheckIn={handleCheckIn}
        onCheckout={handleCheckout}
        onCancel={handleCancel}
        onViewDetails={setDetailBookingId}
        onApplyCharge={setApplyingChargeFor}
      />

      {scoreModalBooking && (
        <LogScoreModal
          booking={scoreModalBooking}
          onSubmit={handleScoreSubmit}
          onSkip={() => setScoreModalBooking(null)}
        />
      )}

      {detailBookingId && (
        <BookingDetailModal
          bookingId={detailBookingId}
          onClose={() => setDetailBookingId(null)}
        />
      )}

      {editingGame && (
        <GameEditModal
          game={editingGame}
          onClose={() => setEditingGame(null)}
          onSave={handleGameEdit}
        />
      )}

      {applyingChargeFor && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setApplyingChargeFor(null)}
        >
          <div
            className="card"
            style={{ maxWidth: 400, width: '100%', padding: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Apply Extra Charge</h3>
            <form onSubmit={handleApplyCharge} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label>Charge Type</label>
                <select
                  value={chargeForm.charge_type_id}
                  onChange={(e) => setChargeForm({ ...chargeForm, charge_type_id: e.target.value })}
                  required
                >
                  <option value="">Select charge type...</option>
                  {chargeTypes.filter(c => c.status === 'active').map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name} - ₦{Number(ct.amount).toLocaleString()} ({ct.unit === 'per_hour' ? 'per hour' : 'flat'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label>Quantity</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={chargeForm.quantity}
                  onChange={(e) => setChargeForm({ ...chargeForm, quantity: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  Apply
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setApplyingChargeFor(null)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--surface-raised)', border: '1px solid var(--border)', padding: '12px 18px', borderRadius: 10 }}>
          {toast}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div className="mono" style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}
