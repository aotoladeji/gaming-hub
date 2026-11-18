import React from 'react';

const STATUS_BADGE = {
  Pending: 'badge-pending',
  Confirmed: 'badge-confirmed',
  Active: 'badge-active',
  Completed: 'badge-completed',
  Cancelled: 'badge-cancelled',
};

export default function BookingsTable({ bookings, search, onSearchChange, onCheckIn, onCheckout, onConfirm, onCancel, onViewDetails, onApplyCharge }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>All Bookings</h2>
        <input
          placeholder="Search name, phone, or ticket #"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Ticket</th>
              <th>Customer</th>
              <th>Game / Station</th>
              <th>Slot</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length === 0 && (
              <tr><td colSpan={7} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No bookings found.</td></tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="mono" style={{ cursor: 'pointer', color: 'var(--violet)' }} onClick={() => onViewDetails?.(b.id)}>
                  {b.ticket_number}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.phone_number}</div>
                </td>
                <td>
                  <div>{b.game_title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.station_name}</div>
                </td>
                <td>
                  <div>{b.booking_date}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.start_time.slice(0,5)}–{b.end_time.slice(0,5)}</div>
                </td>
                <td className="mono">₦{Number(b.total_price).toLocaleString()}</td>
                <td><span className={`badge ${STATUS_BADGE[b.status]}`}>{b.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {b.status === 'Pending' && (
                      <button className="btn btn-outline btn-sm" onClick={() => onConfirm(b.id)}>Confirm</button>
                    )}
                    {b.status === 'Confirmed' && (
                      <button className="btn btn-mint btn-sm" onClick={() => onCheckIn(b.id)}>Check-In</button>
                    )}
                    {b.status === 'Active' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => onCheckout(b.id)}>Complete</button>
                        {onApplyCharge && (
                          <button className="btn btn-outline btn-sm" onClick={() => onApplyCharge(b.id)}>+ Charge</button>
                        )}
                      </>
                    )}
                    {(b.status === 'Pending' || b.status === 'Confirmed') && (
                      <button className="btn btn-danger btn-sm" onClick={() => onCancel(b.id)}>Cancel</button>
                    )}
                    {onViewDetails && (
                      <button className="btn btn-outline btn-sm" onClick={() => onViewDetails(b.id)}>View</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
