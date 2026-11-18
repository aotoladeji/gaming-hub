import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api/api';

const STATUS_BADGE = {
  Pending: 'badge-pending', Confirmed: 'badge-confirmed', Active: 'badge-active',
  Completed: 'badge-completed', Cancelled: 'badge-cancelled',
};

export default function ManageBookingPage() {
  const [searchParams] = useSearchParams();
  const [ticket, setTicket] = useState(searchParams.get('ticket') || '');
  const [phone, setPhone] = useState('');
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [message, setMessage] = useState('');

  async function lookup(e) {
    e?.preventDefault();
    setError(''); setMessage(''); setBooking(null); setLoading(true);
    try {
      const data = await api.getTicket(ticket.trim());
      setBooking(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Auto-lookup if a ticket was passed via ?ticket=
  useEffect(() => { if (searchParams.get('ticket')) lookup(); }, []); // eslint-disable-line

  async function handleCancel() {
    if (!phone.trim()) { setError('Enter the phone number used for this booking to confirm cancellation.'); return; }
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return;

    setCancelling(true); setError('');
    try {
      const updated = await api.cancelBooking(booking.ticket_number, phone.trim());
      setBooking(updated);
      setMessage('Your booking has been cancelled.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  const canCancel = booking && ['Pending', 'Confirmed'].includes(booking.status);

  return (
    <div className="container" style={{ maxWidth: 480, padding: '48px 24px' }}>
      <Link to="/" style={{ color: 'var(--text-muted)', fontSize: 13 }}>&larr; Back to games</Link>

      <div className="card" style={{ padding: 28, marginTop: 20 }}>
        <h1 style={{ fontSize: 24, marginBottom: 6 }}>Manage Your Booking</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 22 }}>
          Look up your ticket, then cancel it if your plans changed.
        </p>

        <form onSubmit={lookup} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <input value={ticket} onChange={(e) => setTicket(e.target.value)} placeholder="Ticket ID e.g. GHK-93263D" required />
          <button className="btn btn-outline btn-sm" type="submit" disabled={loading} style={{ whiteSpace: 'nowrap' }}>
            {loading ? 'Looking up…' : 'Find'}
          </button>
        </form>

        {error && <div className="field-error" style={{ marginBottom: 16 }}>{error}</div>}
        {message && <div style={{ color: 'var(--mint)', fontSize: 14, marginBottom: 16 }}>{message}</div>}

        {booking && (
          <div style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span className="mono" style={{ fontWeight: 700 }}>{booking.ticket_number}</span>
              <span className={`badge ${STATUS_BADGE[booking.status]}`}>{booking.status}</span>
            </div>
            <div style={{ fontSize: 14, display: 'flex', flexDirection: 'column', gap: 6, color: 'var(--text-muted)' }}>
              <div>{booking.game_title} · {booking.station_name}</div>
              <div>{booking.booking_date} · {booking.start_time?.slice(0,5)}–{booking.end_time?.slice(0,5)}</div>
              <div className="mono" style={{ color: 'var(--mint)' }}>₦{Number(booking.total_price).toLocaleString()}</div>
            </div>

            {canCancel && (
              <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <label>Confirm your phone number to cancel</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone used at booking" style={{ marginBottom: 10 }} />
                <button className="btn btn-danger" style={{ width: '100%' }} onClick={handleCancel} disabled={cancelling}>
                  {cancelling ? 'Cancelling…' : 'Cancel Booking'}
                </button>
              </div>
            )}
            {!canCancel && booking.status !== 'Cancelled' && (
              <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                This ticket has already been checked in or completed — contact the front desk for changes.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
