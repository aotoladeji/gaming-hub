import React, { useEffect, useState } from 'react';
import { api } from '../api/api';
import CountdownTimer from './CountdownTimer';

export default function BookingDetailModal({ bookingId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookingDetails(bookingId)
      .then(setData)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [bookingId]);

  if (!bookingId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: 700,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>
        ) : !data ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--red)' }}>Failed to load booking details</div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 22, marginBottom: 8 }}>Booking Details</h2>
                <div className="mono" style={{ color: 'var(--text-muted)' }}>{data.booking.ticket_number}</div>
              </div>
              <button
                onClick={onClose}
                className="btn-sm"
                style={{ background: 'transparent', border: 'none', fontSize: 24, padding: 0, width: 32, height: 32 }}
              >
                ×
              </button>
            </div>

            {/* Status Badge */}
            <div style={{ marginBottom: 24 }}>
              <span className={`badge badge-${data.booking.status.toLowerCase()}`}>{data.booking.status}</span>
            </div>

            {/* Customer Info */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Customer Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, fontSize: 14 }}>
                <div style={{ color: 'var(--text-muted)' }}>Name:</div>
                <div>{data.booking.customer_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>Phone:</div>
                <div className="mono">{data.booking.phone_number}</div>
                {data.booking.customer_email && (
                  <>
                    <div style={{ color: 'var(--text-muted)' }}>Email:</div>
                    <div>{data.booking.customer_email}</div>
                  </>
                )}
              </div>
            </div>

            {/* Game & Station Info */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Session Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, fontSize: 14 }}>
                <div style={{ color: 'var(--text-muted)' }}>Game:</div>
                <div>{data.booking.game_title}</div>
                <div style={{ color: 'var(--text-muted)' }}>Station:</div>
                <div>{data.booking.station_name}</div>
                <div style={{ color: 'var(--text-muted)' }}>Console:</div>
                <div>{data.booking.console_type}</div>
                <div style={{ color: 'var(--text-muted)' }}>Category:</div>
                <div>{data.booking.category}</div>
                <div style={{ color: 'var(--text-muted)' }}>Date:</div>
                <div>{new Date(data.booking.booking_date).toLocaleDateString()}</div>
                <div style={{ color: 'var(--text-muted)' }}>Time:</div>
                <div>{data.booking.start_time} - {data.booking.end_time}</div>
                <div style={{ color: 'var(--text-muted)' }}>Duration:</div>
                <div>{data.booking.duration_hours} hour{data.booking.duration_hours !== 1 ? 's' : ''}</div>
              </div>
            </div>

            {/* Timer for Active Sessions */}
            {data.timing_info && (
              <div style={{ marginBottom: 24, padding: 16, background: 'var(--surface)', borderRadius: 8 }}>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Session Timer</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <CountdownTimer
                    remainingSeconds={data.timing_info.remaining_seconds}
                    totalSeconds={data.timing_info.total_seconds}
                    size={80}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Started at</div>
                    <div>{new Date(data.booking.actual_start_at).toLocaleTimeString()}</div>
                    {data.timing_info.is_overtime && (
                      <div style={{ color: 'var(--red)', fontSize: 13, marginTop: 4 }}>⚠️ Session overtime</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Breakdown */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12 }}>Pricing</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, fontSize: 14 }}>
                <div>Base Price ({data.booking.duration_hours}h):</div>
                <div className="mono">₦{Number(data.booking.base_price).toLocaleString()}</div>
                
                {data.charges.length > 0 && (
                  <>
                    <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontWeight: 600 }}>
                      Extra Charges:
                    </div>
                    {data.charges.map((charge) => (
                      <React.Fragment key={charge.id}>
                        <div style={{ paddingLeft: 12, color: 'var(--text-muted)' }}>
                          {charge.charge_name} ({charge.unit === 'per_hour' ? `${charge.quantity}h` : `×${charge.quantity}`})
                        </div>
                        <div className="mono">₦{Number(charge.amount).toLocaleString()}</div>
                      </React.Fragment>
                    ))}
                  </>
                )}
                
                <div style={{ gridColumn: '1 / -1', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: 16 }}>
                  Total:
                </div>
                <div className="mono" style={{ fontWeight: 700, fontSize: 16 }}>
                  ₦{Number(data.booking.total_price).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Transactions */}
            {data.transactions.length > 0 && (
              <div>
                <h3 style={{ fontSize: 16, marginBottom: 12 }}>Payment History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      style={{
                        padding: 12,
                        background: 'var(--surface)',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 14,
                      }}
                    >
                      <div>
                        <div className="mono" style={{ fontWeight: 600 }}>₦{Number(tx.amount).toLocaleString()}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                          {tx.payment_method.toUpperCase()} · {new Date(tx.paid_at).toLocaleString()}
                        </div>
                        {tx.recorded_by_name && (
                          <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>by {tx.recorded_by_name}</div>
                        )}
                      </div>
                      <div style={{ color: 'var(--mint)' }}>✓ Paid</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
              <div>Created: {new Date(data.booking.created_at).toLocaleString()}</div>
              {data.booking.actual_start_at && (
                <div>Started: {new Date(data.booking.actual_start_at).toLocaleString()}</div>
              )}
              {data.booking.actual_end_at && (
                <div>Ended: {new Date(data.booking.actual_end_at).toLocaleString()}</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
