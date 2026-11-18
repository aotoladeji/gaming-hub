import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function GameCard({ game }) {
  const navigate = useNavigate();
  const slotsLeft = game.available_slots ?? '—';

  return (
    <div
      className="card"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          height: 160,
          backgroundImage: `url(${game.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
        }}
      >
        <span
          className="badge badge-active"
          style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(10,14,23,0.75)', color: '#B5A3FF' }}
        >
          {game.console_type}
        </span>
      </div>

      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <h3 style={{ fontSize: 20 }}>{game.title}</h3>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Per hour</div>
            <div className="mono" style={{ fontSize: 18, color: 'var(--mint)', fontWeight: 700 }}>
              ₦{Number(game.price_per_hour).toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Slots open</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{slotsLeft}</div>
          </div>
        </div>

        <button
          className="btn btn-primary"
          style={{ marginTop: 'auto' }}
          onClick={() => navigate(`/book/${game.id}`)}
        >
          Book Now
        </button>
      </div>
    </div>
  );
}
