import React, { useEffect, useState } from 'react';
import { api } from '../api/api';

export default function Leaderboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api.getLeaderboard()
      .then((data) => { if (!cancelled) setEntries(data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="card" style={{ padding: 22 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h2 style={{ fontSize: 22 }}>Leaderboard</h2>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Top players this season</span>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)' }}>Loading rankings…</div>}
      {!loading && entries.length === 0 && (
        <div style={{ color: 'var(--text-muted)' }}>No scores recorded yet.</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 14px',
              borderRadius: 10,
              background: i === 0 ? 'rgba(124,92,255,0.12)' : 'var(--bg-alt)',
              border: i === 0 ? '1px solid rgba(124,92,255,0.35)' : '1px solid transparent',
            }}
          >
            <div
              className="mono"
              style={{
                width: 28, textAlign: 'center', fontWeight: 700,
                color: i === 0 ? 'var(--mint)' : 'var(--text-muted)',
              }}
            >
              #{i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{entry.player_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.game_title}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="mono" style={{ fontWeight: 700, color: 'var(--mint)' }}>{entry.score} pts</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{entry.wins} wins</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
