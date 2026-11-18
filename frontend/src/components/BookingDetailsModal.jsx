import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function BookingDetailsModal({ bookingId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getBookingDetails(bookingId)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 700 }}>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 700 }}>
          <div style={{ color: 'var(--red)' }}>{error}</div>
        </div>
      </div>
    );
  }

  const { booking, charges, transactions, timing_info } = data;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content card" onClick={(e) => e.stopPropagation()} style={{ padding: 24, maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 22, marginBottom: 4 }}>Booking Details</h2>
            <div className="mono" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{booking.ticket_number}</div>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm">Close</button>
        </div>

        {/* Status Badge */}
        <div style={{ marginBottom: 24 }}>
          <span className={`badge ${
            booking.status === 'Active' ? 'badge-active' :
            booking.status === 'Completed' ? 'badge-completed' :
            booking.status === 'Confirmed' ? 'badge-confirmed' :
            booking.status === 'Cancelled' ? 'badge-cancelled' : 'badge-pending'
          }`}>
            {booking.status}
          </span>
        </div>

        {/* Customer Info */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Customer Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</div>
              <div style={{ fontWeight: 600 }}>{booking.customer_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Phone</div>
              <div className="mono">{booking.phone_number}</div>
            </div>
            {booking.customer_email && (
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</div>
                <div>{booking.customer_email}</div>
              </div>
            )}
          </div>
        </section>

        {/* Session Info */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Session Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Game</div>
              <div style={{ fontWeight: 600 }}>{booking.game_title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{booking.category}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Station</div>
              <div style={{ fontWeight: 600 }}>{booking.station_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date</div>
              <div>{new Date(booking.booking_date).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scheduled Time</div>
              <div className="mono">{booking.start_time} - {booking.end_time}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Duration</div>
              <div>{booking.duration_hours} hours</div>
            </div>
            {booking.actual_start_at && (
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Actual Start</div>
                <div className="mono">{new Date(booking.actual_start_at).toLocaleTimeString()}</div>
              </div>
            )}
          </div>
        </section>

        {/* Timing Info for Active Sessions */}
        {timing_info && (
          <section style={{ marginBottom: 24, padding: 16, background: 'var(--surface)', borderRadius: 8 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Session Progress</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Elapsed</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600 }}>
                  {Math.floor(timing_info.elapsed_seconds / 3600)}:{String(Math.floor((timing_info.elapsed_seconds % 3600) / 60)).padStart(2, '0')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Remaining</div>
                <div className="mono" style={{ fontSize: 18, fontWeight: 600, color: timing_info.is_overtime ? 'var(--red)' : 'var(--mint)' }}>
                  {Math.floor(timing_info.remaining_seconds / 3600)}:{String(Math.floor((timing_info.remaining_seconds % 3600) / 60)).padStart(2, '0')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Status</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: timing_info.is_overtime ? 'var(--red)' : 'var(--text)' }}>
                  {timing_info.is_overtime ? 'Overtime' : 'On Time'}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pricing */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Pricing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Price</span>
              <span className="mono">₦{Number(booking.base_price).toLocaleString()}</span>
            </div>
            {charges.length > 0 && (
              <>
                {charges.map((charge) => (
                  <div key={charge.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {charge.charge_name} {charge.quantity !== '1.00' && `(×${charge.quantity})`}
                    </span>
                    <span className="mono">₦{Number(charge.amount).toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Extra Charges</span>
                  <span className="mono">₦{Number(booking.extra_charges).toLocaleString()}</span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span className="mono">₦{Number(booking.total_price).toLocaleString()}</span>
            </div>
          </div>
        </section>

        {/* Transactions */}
        {transactions.length > 0 && (
          <section>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>Payment History</h3>
            <table style={{ width: '100%', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Amount</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Method</th>
                  <th style={{ textAlign: 'left', padding: '8px 0' }}>Recorded By</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ padding: '8px 0' }}>{new Date(tx.paid_at).toLocaleString()}</td>
                    <td className="mono" style={{ padding: '8px 0' }}>₦{Number(tx.amount).toLocaleString()}</td>
                    <td style={{ padding: '8px 0', textTransform: 'capitalize' }}>{tx.payment_method}</td>
                    <td style={{ padding: '8px 0' }}>{tx.recorded_by_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          animation: slideUp 0.2s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
