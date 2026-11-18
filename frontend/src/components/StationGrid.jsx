import React from 'react';
import CountdownTimer from './CountdownTimer';

const STATUS_BADGE = {
  idle: 'badge-idle',
  occupied: 'badge-occupied',
  maintenance: 'badge-pending',
  offline: 'badge-cancelled',
};

export default function StationGrid({ stations, onCheckout }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {stations.map((s) => {
        const active = s.booking_id !== null;
        return (
          <div
            key={s.id}
            className="card"
            style={{
              padding: 16,
              borderColor: active ? 'rgba(124,92,255,0.4)' : 'var(--border)',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.console_type}</div>
              </div>
              <span className={`badge ${STATUS_BADGE[s.status] || 'badge-idle'}`}>{s.status}</span>
            </div>

            {active ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <CountdownTimer remainingSeconds={s.remaining_seconds} totalSeconds={s.total_seconds} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.game_title}</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.ticket_number}</div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '10px 0' }}>
                {s.status === 'idle' ? 'No active session' : 'Unavailable'}
              </div>
            )}

            {active && (
              <button className="btn btn-outline btn-sm" onClick={() => onCheckout(s.booking_id)}>
                Complete Session
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
