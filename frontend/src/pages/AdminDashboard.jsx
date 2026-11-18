import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/api';
import AdminNav from '../components/AdminNav';
import StationGrid from '../components/StationGrid';
import BookingsTable from '../components/BookingsTable';
import BookingDetailModal from '../components/BookingDetailModal';
import LogScoreModal from '../components/LogScoreModal';

const REFRESH_MS = 10000;

export default function AdminDashboard() {
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [scoreModalBooking, setScoreModalBooking] = useState(null);
  const [detailBookingId, setDetailBookingId] = useState(null);

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

  const loadChargeTypes = useCallback(() => {
    api.getChargeTypes().then(setChargeTypes).catch(() => {});
  }, []);

  useEffect(() => {
    loadDashboard();
    loadBookings();
    loadChargeTypes();
    const interval = setInterval(loadDashboard, REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadDashboard, loadBookings, loadChargeTypes]);

  useEffect(() => {
    const t = setTimeout(loadBookings, 300); // debounce search
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
      <AdminNav title="Staff Dashboard" showSuperAdminLink />

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
